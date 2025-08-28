#!/usr/bin/env python3
"""
CouplesWorkout Database Seeding Script
Creates sample users, couples, workouts, habits, and progress data.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import json

# Import our models and database
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.couple import Couple, CoupleMember, CoupleSettings, CoupleRole
from app.models.workout import WorkoutTemplate, WorkoutSession, WorkoutType
from app.models.habit import Habit, HabitLog, HabitCadence, HabitLogStatus
from app.models.progress import ProgressSnapshot
from app.models.share import SharePermissions

def create_sample_users(db: Session):
    """Create sample users"""
    print("Creating sample users...")
    
    users_data = [
        {
            "email": "alex@example.com",
            "password": "password123",
            "display_name": "Alex Smith",
            "birth_year": 1990,
            "height_cm": 175,
            "weight_kg": 70
        },
        {
            "email": "sam@example.com", 
            "password": "password123",
            "display_name": "Sam Johnson",
            "birth_year": 1992,
            "height_cm": 168,
            "weight_kg": 65
        },
        {
            "email": "demo@example.com",
            "password": "password123", 
            "display_name": "Demo User",
            "birth_year": 1988,
            "height_cm": 180,
            "weight_kg": 75
        }
    ]
    
    created_users = []
    for user_data in users_data:
        # Check if user already exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"User {user_data['email']} already exists")
            created_users.append(existing)
            continue
            
        user = User(
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            display_name=user_data["display_name"],
            birth_year=user_data["birth_year"],
            height_cm=user_data["height_cm"],
            weight_kg=user_data["weight_kg"]
        )
        db.add(user)
        created_users.append(user)
        print(f"Created user: {user_data['display_name']}")
    
    db.commit()
    return created_users

def create_sample_couple(db: Session, users):
    """Create a sample couple with the first two users"""
    if len(users) < 2:
        print("Need at least 2 users to create a couple")
        return None
        
    print("Creating sample couple...")
    
    # Check if users are already in couples
    existing_membership = db.query(CoupleMember).filter(
        CoupleMember.user_id.in_([users[0].id, users[1].id])
    ).first()
    
    if existing_membership:
        print("Users are already in couples")
        return existing_membership.couple_id
    
    # Create couple
    couple = Couple()
    db.add(couple)
    db.flush()
    
    # Add members
    member1 = CoupleMember(
        user_id=users[0].id,
        couple_id=couple.id,
        role=CoupleRole.owner
    )
    member2 = CoupleMember(
        user_id=users[1].id,
        couple_id=couple.id,
        role=CoupleRole.member
    )
    
    db.add(member1)
    db.add(member2)
    
    # Create couple settings
    settings = CoupleSettings(
        couple_id=couple.id,
        share_progress_enabled=True,
        share_habits_enabled=True
    )
    db.add(settings)
    
    db.commit()
    print(f"Created couple between {users[0].display_name} and {users[1].display_name}")
    
    return couple.id

def create_workout_templates(db: Session, users):
    """Create sample workout templates"""
    print("Creating workout templates...")
    
    templates_data = [
        {
            "name": "Full Body Beginner",
            "type": WorkoutType.gym,
            "exercises": [
                {"name": "Squats", "sets": 3, "reps": 12, "weight_kg": 20},
                {"name": "Push-ups", "sets": 3, "reps": 10},
                {"name": "Plank", "duration_sec": 30},
                {"name": "Lunges", "sets": 2, "reps": 8}
            ]
        },
        {
            "name": "Home HIIT",
            "type": WorkoutType.home,
            "exercises": [
                {"name": "Jumping Jacks", "sets": 4, "duration_sec": 45},
                {"name": "Burpees", "sets": 3, "reps": 10},
                {"name": "Mountain Climbers", "sets": 3, "duration_sec": 30},
                {"name": "High Knees", "sets": 3, "duration_sec": 30}
            ]
        },
        {
            "name": "Upper Body Strength",
            "type": WorkoutType.gym,
            "exercises": [
                {"name": "Bench Press", "sets": 4, "reps": 8, "weight_kg": 60},
                {"name": "Pull-ups", "sets": 3, "reps": 6},
                {"name": "Shoulder Press", "sets": 3, "reps": 10, "weight_kg": 15},
                {"name": "Bicep Curls", "sets": 3, "reps": 12, "weight_kg": 10}
            ]
        }
    ]
    
    # Create system templates (no owner)
    for template_data in templates_data:
        existing = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.name == template_data["name"],
            WorkoutTemplate.owner_user_id.is_(None)
        ).first()
        
        if existing:
            print(f"System template {template_data['name']} already exists")
            continue
            
        template = WorkoutTemplate(
            owner_user_id=None,  # System template
            name=template_data["name"],
            type=template_data["type"],
            exercises=template_data["exercises"]
        )
        db.add(template)
        print(f"Created system template: {template_data['name']}")
    
    # Create user-specific template
    if users:
        user_template = WorkoutTemplate(
            owner_user_id=users[0].id,
            name="Alex's Custom Routine",
            type=WorkoutType.gym,
            exercises=[
                {"name": "Deadlifts", "sets": 4, "reps": 6, "weight_kg": 80},
                {"name": "Barbell Rows", "sets": 3, "reps": 8, "weight_kg": 50}
            ]
        )
        db.add(user_template)
        print(f"Created custom template for {users[0].display_name}")
    
    db.commit()

def create_sample_habits(db: Session, users):
    """Create sample habits for users"""
    print("Creating sample habits...")
    
    habits_data = [
        {"name": "Drink 8 glasses of water", "cadence": HabitCadence.daily, "reminder": "08:00"},
        {"name": "10 minute walk", "cadence": HabitCadence.daily, "reminder": "19:00"},
        {"name": "Stretch for 5 minutes", "cadence": HabitCadence.daily, "reminder": "07:30"},
        {"name": "Meal prep", "cadence": HabitCadence.weekly, "reminder": "10:00"},
    ]
    
    for i, user in enumerate(users[:2]):  # Only create for first two users
        for j, habit_data in enumerate(habits_data):
            if j >= 3 and i == 1:  # Give second user fewer habits
                break
                
            existing = db.query(Habit).filter(
                Habit.user_id == user.id,
                Habit.name == habit_data["name"]
            ).first()
            
            if existing:
                continue
                
            habit = Habit(
                user_id=user.id,
                name=habit_data["name"],
                cadence=habit_data["cadence"],
                reminder_time_local=habit_data["reminder"],
                is_active=True
            )
            db.add(habit)
            print(f"Created habit '{habit_data['name']}' for {user.display_name}")
    
    db.commit()

def create_sample_data(db: Session, users, couple_id):
    """Create sample workout sessions, habit logs, and progress snapshots"""
    print("Creating sample workout sessions and logs...")
    
    if not users or not couple_id:
        return
    
    # Create workout sessions for the past week
    for i in range(7):
        session_date = datetime.now() - timedelta(days=i)
        
        for user in users[:2]:  # First two users
            if i % 2 == 0:  # Every other day
                session = WorkoutSession(
                    user_id=user.id,
                    couple_id=couple_id,
                    mode=WorkoutType.gym if i % 4 == 0 else WorkoutType.home,
                    start_time=session_date.replace(hour=9, minute=0),
                    end_time=session_date.replace(hour=9, minute=45),
                    notes="Great workout!" if i == 0 else None,
                    exercises_performed=[
                        {"name": "Squats", "sets": 3, "reps": 12, "weight_kg": 20},
                        {"name": "Push-ups", "sets": 3, "reps": 10}
                    ],
                    metrics={"total_volume": 240, "duration_minutes": 45}
                )
                db.add(session)
    
    # Create habit logs for the past week
    user_habits = db.query(Habit).filter(Habit.user_id.in_([user.id for user in users[:2]])).all()
    
    for i in range(7):
        log_date = date.today() - timedelta(days=i)
        
        for habit in user_habits:
            if i % 3 != 0:  # Skip some days to make it realistic
                status = HabitLogStatus.done if i % 4 != 0 else HabitLogStatus.skipped
                log = HabitLog(
                    habit_id=habit.id,
                    date=log_date,
                    status=status,
                    notes="Felt great!" if status == HabitLogStatus.done and i == 0 else None
                )
                db.add(log)
    
    # Create progress snapshots
    for i in range(4):  # Last 4 weeks
        snapshot_date = date.today() - timedelta(weeks=i)
        
        for j, user in enumerate(users[:2]):
            weight_change = j * 2 - i * 0.5  # Slight variations
            snapshot = ProgressSnapshot(
                user_id=user.id,
                date=snapshot_date,
                metrics={
                    "weight_kg": user.weight_kg + weight_change,
                    "workouts_completed_week": 3 - i % 2,
                    "habits_completed_week": 5 - i
                }
            )
            db.add(snapshot)
    
    db.commit()

def create_share_permissions(db: Session, users):
    """Create sharing permissions between the couple"""
    print("Creating share permissions...")
    
    if len(users) < 2:
        return
    
    # User 1 shares with User 2
    perm1 = SharePermissions(
        owner_user_id=users[0].id,
        viewer_user_id=users[1].id,
        can_view_progress=True,
        can_view_habits=True
    )
    
    # User 2 shares with User 1  
    perm2 = SharePermissions(
        owner_user_id=users[1].id,
        viewer_user_id=users[0].id,
        can_view_progress=True,
        can_view_habits=False  # Only shares progress, not habits
    )
    
    db.add(perm1)
    db.add(perm2)
    db.commit()
    
    print(f"Created mutual sharing permissions between {users[0].display_name} and {users[1].display_name}")

def seed_database():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    db = SessionLocal()
    try:
        # Create sample data
        users = create_sample_users(db)
        couple_id = create_sample_couple(db, users)
        create_workout_templates(db, users)
        create_sample_habits(db, users)
        create_sample_data(db, users, couple_id)
        create_share_permissions(db, users)
        
        print("✅ Database seeding completed successfully!")
        print("\nSample accounts created:")
        for user in users:
            print(f"  📧 {user.email} / password: password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()