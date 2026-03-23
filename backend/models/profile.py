from __future__ import annotations
from datetime import datetime
import uuid
from sqlalchemy import String, ARRAY, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel
from db import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    brands: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    colors_liked: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    colors_avoided: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    style_tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    occasion_prefs: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    reference_image_urls: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    size_prefs: Mapped[dict] = mapped_column(JSONB, default=dict)
    budget_defaults: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ProfileUpdate(BaseModel):
    brands: list[str] = []
    colors_liked: list[str] = []
    colors_avoided: list[str] = []
    style_tags: list[str] = []
    occasion_prefs: list[str] = []
    reference_image_urls: list[str] = []
    size_prefs: dict = {}
    budget_defaults: dict = {}


class ProfileRead(ProfileUpdate):
    id: str
    user_id: str

    class Config:
        from_attributes = True
