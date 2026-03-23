from __future__ import annotations
from datetime import datetime
import uuid
from typing import Optional
from sqlalchemy import String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel
from db import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    mode: Mapped[str] = mapped_column(String, nullable=False)  # "form" | "chat"
    inputs: Mapped[dict] = mapped_column(JSONB, default=dict)
    input_overrides: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(String, default="active")  # "active" | "closed"
    agent_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SessionInputs(BaseModel):
    category: str
    occasion: str
    colors_liked: list[str] = []
    budget_min: float
    budget_max: float
    style_override: list[str] = []


class StartSessionRequest(BaseModel):
    mode: str  # "form" | "chat"
    inputs: Optional[SessionInputs] = None


class SessionRead(BaseModel):
    id: str
    mode: str
    status: str
    inputs: dict
    started_at: datetime

    class Config:
        from_attributes = True
