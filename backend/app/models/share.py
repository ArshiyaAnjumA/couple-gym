from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base

class SharePermissions(Base):
    __tablename__ = "share_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    viewer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    can_view_progress = Column(Boolean, default=False)
    can_view_habits = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id], back_populates="shared_permissions_owned")
    viewer = relationship("User", foreign_keys=[viewer_user_id], back_populates="shared_permissions_received")