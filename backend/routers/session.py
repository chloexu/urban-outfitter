from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from db import get_db
from auth import get_current_user
from models.profile import Profile
from models.session import Session, StartSessionRequest, SessionRead, SessionInputs
from models.outcome import SessionOutcome, CloseSessionRequest

router = APIRouter(prefix="/session", tags=["session"])


async def get_active_session(profile_id: str, db: AsyncSession) -> Session | None:
    result = await db.execute(
        select(Session).where(Session.profile_id == profile_id, Session.status == "active")
    )
    return result.scalar_one_or_none()


@router.post("", response_model=SessionRead, status_code=201)
async def start_session(
    body: StartSessionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    active = await get_active_session(profile.id, db)
    if active:
        raise HTTPException(status_code=409, detail="A shopping session is already running.")

    session = Session(
        profile_id=profile.id,
        mode=body.mode,
        inputs=body.inputs.model_dump() if body.inputs else {},
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/resume", status_code=200)
async def resume_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validates the session is resumable. The actual resume happens when the client
    re-connects to GET /search/{session_id}/stream — the SSE endpoint reads agent_state
    from DB and continues from the saved position (current_retailer_index, current_page)."""
    session = await db.get(Session, session_id)
    if not session or session.status != "active" or not session.agent_state:
        raise HTTPException(status_code=422, detail="Session is not resumable.")
    return {"resumable": True, "connect_to": f"/search/{session_id}/stream"}


@router.post("/{session_id}/close")
async def close_session(
    session_id: str,
    body: CloseSessionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    session.status = "closed"
    session.closed_at = datetime.now(timezone.utc)
    outcome = SessionOutcome(
        session_id=session_id,
        **body.model_dump()
    )
    db.add(outcome)
    await db.commit()
    await db.refresh(session)
    return {"status": "closed"}


class ChatMessageRequest(BaseModel):
    message: str


@router.post("/{session_id}/chat")
async def chat_turn(
    session_id: str,
    body: ChatMessageRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from agent.llm_chat import ChatHandler
    from models.chat_message import ChatMessage

    session = await db.get(Session, session_id)
    if not session or session.mode != "chat":
        raise HTTPException(status_code=404, detail="Chat session not found.")

    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    handler = ChatHandler(session_id=session_id, profile={
        "brands": profile.brands if profile else [],
        "style_tags": profile.style_tags if profile else [],
        "colors_liked": profile.colors_liked if profile else [],
        "occasion_prefs": profile.occasion_prefs if profile else [],
    }, db=db)

    # Restore history from DB
    msgs = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.turn_index)
    )
    for msg in msgs.scalars():
        handler.history.append({"role": msg.role, "content": msg.content})
    handler.turn_index = len(handler.history)

    result = await handler.send_message(body.message)

    if isinstance(result, SessionInputs):
        # Chat resolved — update session inputs and signal ready to search
        session.inputs = result.model_dump()
        await db.commit()
        return {"resolved": True, "inputs": result.model_dump()}

    return {"reply": result, "resolved": False}
