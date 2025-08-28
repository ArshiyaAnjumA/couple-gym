from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import uuid

class ProgressSnapshotCreate(BaseModel):
    date: date
    metrics: dict  # {"weight_kg": float?, "bodyfat_pct": float?, "waist_cm": float?, "workouts_completed_week": int, "habits_completed_week": int}

class ProgressSnapshotResponse(BaseModel):
    id: uuid.UUID
    date: date
    metrics: dict
    created_at: datetime

    class Config:
        from_attributes = True

class ProgressSummaryResponse(BaseModel):
    current: dict
    current_date: Optional[date] = None
    previous: dict  
    previous_date: Optional[date] = None
    changes: dict