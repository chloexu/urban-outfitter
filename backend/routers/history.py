from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db import get_db
from auth import get_current_user
from models.profile import Profile
from models.session import Session
from models.result import Result
from models.outcome import SessionOutcome

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(
    page: int = Query(default=1, ge=1),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return {"sessions": [], "total": 0}

    per_page = 20
    offset = (page - 1) * per_page

    sessions_result = await db.execute(
        select(Session)
        .where(Session.profile_id == profile.id, Session.status == "closed")
        .order_by(Session.started_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    sessions = sessions_result.scalars().all()

    result_counts = {}
    for s in sessions:
        count_result = await db.execute(
            select(func.count()).where(Result.session_id == s.id)
        )
        result_counts[s.id] = count_result.scalar()

    outcomes = {}
    for s in sessions:
        outcome_result = await db.execute(
            select(SessionOutcome).where(SessionOutcome.session_id == s.id)
        )
        outcome = outcome_result.scalar_one_or_none()
        if outcome:
            outcomes[s.id] = {
                "made_purchase": outcome.made_purchase,
                "rating": outcome.rating,
                "feedback": outcome.feedback,
            }

    total_result = await db.execute(
        select(func.count()).where(Session.profile_id == profile.id, Session.status == "closed")
    )

    return {
        "sessions": [
            {
                "id": s.id,
                "mode": s.mode,
                "inputs": s.inputs,
                "started_at": s.started_at.isoformat(),
                "closed_at": s.closed_at.isoformat() if s.closed_at else None,
                "result_count": result_counts.get(s.id, 0),
                **outcomes.get(s.id, {}),
            }
            for s in sessions
        ],
        "total": total_result.scalar(),
        "page": page,
    }
