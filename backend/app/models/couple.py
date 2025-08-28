from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from ..core.database import Base

class CoupleRole(str, enum.Enum):
    owner = "owner"
    member = "member"

class Couple(Base):
    __tablename__ = "couples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    members = relationship("CoupleMember", back_populates="couple", cascade="all, delete-orphan")
    settings = relationship("CoupleSettings", back_populates="couple", uselist=False, cascade="all, delete-orphan")
    workout_sessions = relationship("WorkoutSession", back_populates="couple")

class CoupleMember(Base):
    __tablename__ = "couple_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"), nullable=False)
    role = Column(Enum(CoupleRole), nullable=False, default=CoupleRole.member)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="couple_memberships")
    couple = relationship("Couple", back_populates="members")

class CoupleSettings(Base):
    __tablename__ = "couple_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"), nullable=False)
    share_progress_enabled = Column(Boolean, default=True)
    share_habits_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    couple = relationship("Couple", back_populates="settings")