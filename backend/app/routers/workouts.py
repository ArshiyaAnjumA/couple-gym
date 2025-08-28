from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import uuid

from ..core.database import get_db
from ..dependencies.auth import get_current_active_user
from ..models.user import User
from ..models.workout import WorkoutTemplate, WorkoutSession, WorkoutType
from ..models.couple import CoupleMember

router = APIRouter(prefix="/workout-templates", tags=["workouts"])
sessions_router = APIRouter(prefix="/workout-sessions", tags=["workouts"])

# Workout Templates

@router.post("/")
async def create_workout_template(
    name: str,
    workout_type: WorkoutType,
    exercises: List[dict],  # [{"name": str, "sets": int, "reps": int, "weight_kg": float?, "duration_sec": int?}]
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    template = WorkoutTemplate(
        owner_user_id=current_user.id,
        name=name,
        type=workout_type,
        exercises=exercises
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return {
        "id": template.id,
        "name": template.name,
        "type": template.type,
        "exercises": template.exercises,
        "created_at": template.created_at
    }

@router.get("/")
async def get_workout_templates(
    mine: bool = Query(False, description="Only return user's templates"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(WorkoutTemplate)
    
    if mine:
        # Only user's templates
        query = query.filter(WorkoutTemplate.owner_user_id == current_user.id)
    else:
        # User's templates + system templates (where owner_user_id is None)
        query = query.filter(
            (WorkoutTemplate.owner_user_id == current_user.id) |
            (WorkoutTemplate.owner_user_id.is_(None))
        )
    
    templates = query.all()
    
    result = []
    for template in templates:
        result.append({
            "id": template.id,
            "name": template.name,
            "type": template.type,
            "exercises": template.exercises,
            "is_system": template.owner_user_id is None,
            "created_at": template.created_at
        })
    
    return result

# Workout Sessions

@sessions_router.post("/")
async def create_workout_session(
    mode: WorkoutType,
    template_id: Optional[uuid.UUID] = None,
    notes: Optional[str] = None,
    exercises_performed: Optional[List[dict]] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get user's couple if they have one
    couple_membership = db.query(CoupleMember).filter(
        CoupleMember.user_id == current_user.id
    ).first()
    
    couple_id = couple_membership.couple_id if couple_membership else None
    
    # Default start_time to now if not provided
    if start_time is None:
        start_time = datetime.utcnow()
    
    session = WorkoutSession(
        user_id=current_user.id,
        couple_id=couple_id,
        template_id=template_id,
        mode=mode,
        start_time=start_time,
        end_time=end_time,
        notes=notes,
        exercises_performed=exercises_performed or []
    )
    
    # Calculate basic metrics if session is completed
    if end_time and exercises_performed:
        total_volume = 0
        for exercise in exercises_performed:
            if 'sets' in exercise and 'reps' in exercise and 'weight_kg' in exercise:
                total_volume += exercise['sets'] * exercise['reps'] * exercise.get('weight_kg', 0)
        
        session.metrics = {
            "total_volume": total_volume,
            "duration_minutes": int((end_time - start_time).total_seconds() / 60)
        }
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "mode": session.mode,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "notes": session.notes,
        "exercises_performed": session.exercises_performed,
        "metrics": session.metrics
    }

@sessions_router.get("/")
async def get_workout_sessions(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    )
    
    if from_date:
        query = query.filter(WorkoutSession.start_time >= datetime.combine(from_date, datetime.min.time()))
    
    if to_date:
        query = query.filter(WorkoutSession.start_time <= datetime.combine(to_date, datetime.max.time()))
    
    sessions = query.order_by(WorkoutSession.start_time.desc()).all()
    
    result = []
    for session in sessions:
        result.append({
            "id": session.id,
            "mode": session.mode,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "notes": session.notes,
            "exercises_performed": session.exercises_performed,
            "metrics": session.metrics,
            "template_id": session.template_id
        })
    
    return result

@sessions_router.get("/stats/weekly")
async def get_weekly_workout_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get sessions from last 7 days
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.start_time >= week_ago,
        WorkoutSession.end_time.isnot(None)  # Only completed sessions
    ).all()
    
    total_sessions = len(sessions)
    total_volume = 0
    total_duration = 0
    gym_sessions = 0
    home_sessions = 0
    
    for session in sessions:
        if session.metrics:
            total_volume += session.metrics.get("total_volume", 0)
            total_duration += session.metrics.get("duration_minutes", 0)
        
        if session.mode == WorkoutType.gym:
            gym_sessions += 1
        elif session.mode == WorkoutType.home:
            home_sessions += 1
    
    return {
        "period": "last_7_days",
        "total_sessions": total_sessions,
        "gym_sessions": gym_sessions,
        "home_sessions": home_sessions,
        "total_volume_kg": total_volume,
        "total_duration_minutes": total_duration,
        "avg_session_duration": total_duration / total_sessions if total_sessions > 0 else 0
    }

# Include both routers
workout_router = APIRouter()
workout_router.include_router(router)
workout_router.include_router(sessions_router)