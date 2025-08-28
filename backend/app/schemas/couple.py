from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class CoupleCreate(BaseModel):
    pass  # No fields needed, couple created automatically

class CoupleMemberResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True

class CoupleResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    members: list[CoupleMemberResponse] = []

    class Config:
        from_attributes = True

class CoupleSettingsUpdate(BaseModel):
    share_progress_enabled: Optional[bool] = None
    share_habits_enabled: Optional[bool] = None