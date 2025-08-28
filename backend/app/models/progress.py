from sqlalchemy import Column, DateTime, ForeignKey, JSON, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base

class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    metrics = Column(JSON, nullable=False)  # {"weight_kg": float?, "bodyfat_pct": float?, "waist_cm": float?, "workouts_completed_week": int, "habits_completed_week": int}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="progress_snapshots")