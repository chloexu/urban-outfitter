from __future__ import annotations
from datetime import datetime
from typing import Optional
import uuid
from sqlalchemy import String, Boolean, Integer, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel
from db import Base


class SessionOutcome(Base):
    __tablename__ = "session_outcomes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id"), unique=True, nullable=False)
    made_purchase: Mapped[bool] = mapped_column(Boolean, nullable=False)
    from_results: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    result_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("results.id"), nullable=True)
    external_purchase_url: Mapped[str | None] = mapped_column(String, nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CloseSessionRequest(BaseModel):
    made_purchase: bool
    from_results: Optional[bool] = None
    result_id: Optional[str] = None
    external_purchase_url: Optional[str] = None
    rating: int  # 1-5
    feedback: Optional[str] = None
