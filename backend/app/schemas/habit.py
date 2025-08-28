from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import uuid
from ..models.habit import HabitCadence, HabitLogStatus

class HabitCreate(BaseModel):
    name: str
    cadence: HabitCadence = HabitCadence.daily
    reminder_time_local: Optional[str] = None

class HabitResponse(BaseModel):
    id: uuid.UUID
    name: str
    cadence: HabitCadence
    reminder_time_local: Optional[str] = None
    is_active: bool
    created_at: datetime
    today_status: Optional[HabitLogStatus] = None

    class Config:
        from_attributes = True

class HabitLogCreate(BaseModel):
    date: date
    status: HabitLogStatus
    notes: Optional[str] = None

class HabitLogResponse(BaseModel):
    id: uuid.UUID
    habit_id: uuid.UUID
    habit_name: Optional[str] = None
    date: date
    status: HabitLogStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True