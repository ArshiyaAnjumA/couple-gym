from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class SharePermissionsCreate(BaseModel):
    viewer_email: EmailStr
    can_view_progress: bool = False
    can_view_habits: bool = False

class SharePermissionsResponse(BaseModel):
    id: uuid.UUID
    viewer_email: Optional[str] = None
    viewer_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    can_view_progress: bool
    can_view_habits: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SharedDataAvailableResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    avatar_url: Optional[str] = None
    can_view_progress: bool
    can_view_habits: bool