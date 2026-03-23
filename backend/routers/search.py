import asyncio
import json
from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from auth import verify_token
from models.session import Session
from models.profile import Profile
from models.result import Result
from agent.browser_agent import BrowserAgent
from agent.similar_brands import suggest_similar_brands

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/{session_id}/stream")
async def stream_search(
    session_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # Auth via query param (SSE cannot send Authorization header)
    payload = verify_token(token)
    user_id = payload["sub"]

    async def event_generator():
        session = await db.get(Session, session_id)
        if not session or session.status != "active":
            yield f"data: {json.dumps({'type': 'error', 'message': 'Session not found or inactive'})}\n\n"
            return

        profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Profile not found'})}\n\n"
            return

        profile_dict = {
            "brands": profile.brands,
            "colors_liked": profile.colors_liked,
            "colors_avoided": profile.colors_avoided,
            "style_tags": profile.style_tags,
            "reference_image_urls": profile.reference_image_urls,
        }

        # Resume from saved state if present
        agent_state = session.agent_state or {}
        start_retailer = agent_state.get("current_retailer_index", 0)
        start_page = agent_state.get("current_page", 1)

        agent = BrowserAgent(
            profile=profile_dict,
            inputs=session.inputs,
            session_id=session_id,
        )

        total = 0
        async for event in agent.run(start_retailer_index=start_retailer, start_page=start_page):
            # Persist results to DB
            if event["type"] == "result":
                result = Result(
                    session_id=session_id,
                    **{k: v for k, v in event["item"].items() if k != "id"},
                    batch_index=agent_state.get("batch_index", 0),
                )
                db.add(result)
                await db.commit()
                total += 1

            if event["type"] == "batch_complete":
                # Save agent state for resume
                session.agent_state = {
                    "current_retailer_index": start_retailer,
                    "current_page": start_page + 1,
                    "items_found_so_far": total,
                    "batch_index": agent_state.get("batch_index", 0) + 1,
                }
                await db.commit()

            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)  # yield control

        # Fallback if < 3 results
        if total < 3:
            suggestions = await suggest_similar_brands(profile_dict, session.inputs)
            yield f"data: {json.dumps({'type': 'similar_brands', 'brands': suggestions})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disables Railway/nginx proxy buffering
            "Connection": "keep-alive",
        },
    )
