from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from app.core.config import settings
from app.core.database import engine, Base

# Import all models to ensure they're registered with SQLAlchemy
from app.models import *

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

@app.get("/api/")
async def root():
    return {"message": "CouplesWorkout API", "version": "1.0.0"}

# Placeholder for auth endpoints
@app.post("/api/auth/register")
async def register():
    return {"message": "Registration endpoint - to be implemented"}

@app.post("/api/auth/login")
async def login():
    return {"message": "Login endpoint - to be implemented"}

@app.get("/api/me")
async def get_current_user():
    return {"message": "Get current user - to be implemented"}

# Placeholder for workout endpoints
@app.get("/api/workout-templates")
async def get_workout_templates():
    return {"message": "Get workout templates - to be implemented"}

@app.post("/api/workout-sessions")
async def create_workout_session():
    return {"message": "Create workout session - to be implemented"}

# Placeholder for habit endpoints
@app.get("/api/habits")
async def get_habits():
    return {"message": "Get habits - to be implemented"}

@app.post("/api/habits")
async def create_habit():
    return {"message": "Create habit - to be implemented"}

# Placeholder for couple endpoints
@app.post("/api/couples")
async def create_couple():
    return {"message": "Create couple - to be implemented"}

@app.get("/api/couples/{couple_id}/members")
async def get_couple_members():
    return {"message": "Get couple members - to be implemented"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)