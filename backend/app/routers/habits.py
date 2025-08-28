from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import uuid

from ..core.database import get_db
from ..dependencies.auth import get_current_active_user
from ..models.user import User
from ..models.habit import Habit, HabitLog, HabitCadence, HabitLogStatus

router = APIRouter(prefix="/habits", tags=["habits"])

@router.post("/")
async def create_habit(
    name: str,
    cadence: HabitCadence = HabitCadence.daily,
    reminder_time_local: Optional[str] = None,  # "HH:MM" format
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    habit = Habit(
        user_id=current_user.id,
        name=name,
        cadence=cadence,
        reminder_time_local=reminder_time_local,
        is_active=True
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    
    return {
        "id": habit.id,
        "name": habit.name,
        "cadence": habit.cadence,
        "reminder_time_local": habit.reminder_time_local,
        "is_active": habit.is_active,
        "created_at": habit.created_at
    }

@router.get("/")
async def get_habits(
    active_only: bool = Query(True, description="Only return active habits"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Habit).filter(Habit.user_id == current_user.id)
    
    if active_only:
        query = query.filter(Habit.is_active == True)
    
    habits = query.order_by(Habit.created_at.desc()).all()
    
    result = []
    for habit in habits:
        # Get today's log if exists
        today = date.today()
        today_log = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date == today
        ).first()
        
        result.append({
            "id": habit.id,
            "name": habit.name,
            "cadence": habit.cadence,
            "reminder_time_local": habit.reminder_time_local,
            "is_active": habit.is_active,
            "created_at": habit.created_at,
            "today_status": today_log.status if today_log else None
        })
    
    return result

@router.patch("/{habit_id}")
async def update_habit(
    habit_id: uuid.UUID,
    name: Optional[str] = None,
    cadence: Optional[HabitCadence] = None,
    reminder_time_local: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()
    
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Update fields if provided
    if name is not None:
        habit.name = name
    if cadence is not None:
        habit.cadence = cadence
    if reminder_time_local is not None:
        habit.reminder_time_local = reminder_time_local
    if is_active is not None:
        habit.is_active = is_active
    
    db.commit()
    db.refresh(habit)
    
    return {
        "id": habit.id,
        "name": habit.name,
        "cadence": habit.cadence,
        "reminder_time_local": habit.reminder_time_local,
        "is_active": habit.is_active
    }

@router.post("/{habit_id}/logs")
async def create_habit_log(
    habit_id: uuid.UUID,
    log_date: date,
    status: HabitLogStatus,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify habit belongs to user
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()
    
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    # Check if log already exists for this date
    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date == log_date
    ).first()
    
    if existing_log:
        # Update existing log
        existing_log.status = status
        existing_log.notes = notes
        db.commit()
        db.refresh(existing_log)
        return {
            "id": existing_log.id,
            "habit_id": existing_log.habit_id,
            "date": existing_log.date,
            "status": existing_log.status,
            "notes": existing_log.notes
        }
    else:
        # Create new log
        log = HabitLog(
            habit_id=habit_id,
            date=log_date,
            status=status,
            notes=notes
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        
        return {
            "id": log.id,
            "habit_id": log.habit_id,
            "date": log.date,
            "status": log.status,
            "notes": log.notes
        }

@router.get("/logs")
async def get_habit_logs(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    habit_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get user's habits
    user_habit_ids = db.query(Habit.id).filter(
        Habit.user_id == current_user.id
    ).all()
    habit_ids = [h.id for h in user_habit_ids]
    
    if not habit_ids:
        return []
    
    query = db.query(HabitLog).filter(HabitLog.habit_id.in_(habit_ids))
    
    if habit_id:
        # Verify this habit belongs to the user
        if habit_id not in habit_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this habit"
            )
        query = query.filter(HabitLog.habit_id == habit_id)
    
    if from_date:
        query = query.filter(HabitLog.date >= from_date)
    
    if to_date:
        query = query.filter(HabitLog.date <= to_date)
    
    logs = query.order_by(HabitLog.date.desc()).all()
    
    result = []
    for log in logs:
        # Get habit name
        habit = db.query(Habit).filter(Habit.id == log.habit_id).first()
        result.append({
            "id": log.id,
            "habit_id": log.habit_id,
            "habit_name": habit.name if habit else None,
            "date": log.date,
            "status": log.status,
            "notes": log.notes,
            "created_at": log.created_at
        })
    
    return result

@router.get("/stats/weekly")
async def get_weekly_habit_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get logs from last 7 days
    week_ago = date.today() - timedelta(days=7)
    today = date.today()
    
    # Get user's active habits
    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id,
        Habit.is_active == True
    ).all()
    
    # Get logs for the week
    habit_ids = [h.id for h in habits]
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_(habit_ids),
        HabitLog.date >= week_ago,
        HabitLog.date <= today
    ).all()
    
    # Calculate stats
    total_habits = len(habits)
    completed_logs = [log for log in logs if log.status == HabitLogStatus.done]
    skipped_logs = [log for log in logs if log.status == HabitLogStatus.skipped]
    
    # Calculate completion rate
    possible_completions = total_habits * 7  # 7 days
    actual_completions = len(completed_logs)
    completion_rate = (actual_completions / possible_completions * 100) if possible_completions > 0 else 0
    
    return {
        "period": "last_7_days",
        "active_habits": total_habits,
        "completed_count": len(completed_logs),
        "skipped_count": len(skipped_logs),
        "completion_rate": round(completion_rate, 1),
        "streak_days": 0  # TODO: Calculate longest streak
    }