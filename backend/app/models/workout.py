from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from ..core.database import Base

class WorkoutType(str, enum.Enum):
    gym = "gym"
    home = "home"

class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for system templates
    name = Column(String, nullable=False)
    type = Column(Enum(WorkoutType), nullable=False)
    exercises = Column(JSON, nullable=False)  # [{"name": str, "sets": int, "reps": int, "weight_kg": float?, "duration_sec": int?}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="workout_templates")
    sessions = relationship("WorkoutSession", back_populates="template")

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workout_templates.id"), nullable=True)
    mode = Column(Enum(WorkoutType), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    metrics = Column(JSON, nullable=True)  # {"total_volume": float, "calories_est": int?, "heart_rate_avg": int?}
    exercises_performed = Column(JSON, nullable=True)  # Actual exercises with completed sets/reps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    couple = relationship("Couple", back_populates="workout_sessions")
    template = relationship("WorkoutTemplate", back_populates="sessions")