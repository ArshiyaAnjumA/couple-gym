from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    apple_sub = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)  # Nullable for Apple Sign-In users
    display_name = Column(String, nullable=False)
    avatar_url = Column(Text, nullable=True)  # base64 image data
    birth_year = Column(Integer, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    couple_memberships = relationship("CoupleMember", back_populates="user")
    workout_templates = relationship("WorkoutTemplate", back_populates="owner")
    workout_sessions = relationship("WorkoutSession", back_populates="user")
    habits = relationship("Habit", back_populates="user")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="user")
    shared_permissions_owned = relationship("SharePermissions", foreign_keys="SharePermissions.owner_user_id", back_populates="owner")
    shared_permissions_received = relationship("SharePermissions", foreign_keys="SharePermissions.viewer_user_id", back_populates="viewer")