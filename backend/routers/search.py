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
from agent.google_search_agent import GoogleSearchAgent
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
            yield f"event: error\ndata: {json.dumps({'type': 'error', 'message': 'Session not found or inactive'})}\n\n"
            return

        profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            yield f"event: error\ndata: {json.dumps({'type': 'error', 'message': 'Profile not found'})}\n\n"
            return

        profile_dict = {
            "brands": profile.brands,
            "colors_liked": profile.colors_liked,
            "colors_avoided": profile.colors_avoided,
            "style_tags": profile.style_tags,
            "reference_image_urls": profile.reference_image_urls,
        }

        agent = GoogleSearchAgent(
            profile=profile_dict,
            inputs=session.inputs,
            session_id=session_id,
        )

        total = 0
        async for event in agent.run():
            # Persist results to DB
            if event["type"] == "result":
                result = Result(
                    session_id=session_id,
                    **{k: v for k, v in event["item"].items() if k != "id"},
                    batch_index=0,
                )
                db.add(result)
                await db.commit()
                total += 1

            yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)  # yield control

        # Fallback if < 3 results
        if total < 3:
            suggestions = await suggest_similar_brands(profile_dict, session.inputs)
            yield f"event: similar_brands\ndata: {json.dumps({'type': 'similar_brands', 'brands': suggestions})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disables Railway/nginx proxy buffering
            "Connection": "keep-alive",
        },
    )
