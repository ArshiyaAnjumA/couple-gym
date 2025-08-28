from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from ..models.workout import WorkoutType

class ExerciseData(BaseModel):
    name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_sec: Optional[int] = None

class WorkoutTemplateCreate(BaseModel):
    name: str
    type: WorkoutType
    exercises: List[ExerciseData]

class WorkoutTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: WorkoutType
    exercises: List[dict]
    is_system: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class WorkoutSessionCreate(BaseModel):
    mode: WorkoutType
    template_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    exercises_performed: Optional[List[dict]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class WorkoutSessionResponse(BaseModel):
    id: uuid.UUID
    mode: WorkoutType
    start_time: datetime
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    exercises_performed: Optional[List[dict]] = None
    metrics: Optional[dict] = None
    template_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True