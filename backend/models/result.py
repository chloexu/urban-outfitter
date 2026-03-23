from __future__ import annotations
from datetime import datetime
import uuid
from sqlalchemy import String, DateTime, Numeric, Integer, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel
from db import Base


class Result(Base):
    __tablename__ = "results"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id"), nullable=False)
    retailer: Mapped[str] = mapped_column(String, nullable=False)
    product_name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    product_url: Mapped[str] = mapped_column(String, nullable=False)
    batch_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ResultRead(BaseModel):
    id: str
    session_id: str
    retailer: str
    product_name: str
    price: float
    image_url: str
    product_url: str

    class Config:
        from_attributes = True
