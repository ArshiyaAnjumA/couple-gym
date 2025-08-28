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

# Import routers
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.couples import router as couples_router
from app.routers.workouts import workout_router
from app.routers.habits import router as habits_router
from app.routers.progress import router as progress_router
from app.routers.share import router as share_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="CouplesWorkout API - A fitness tracking app for couples",
    version="1.0.0",
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

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api") 
app.include_router(couples_router, prefix="/api")
app.include_router(workout_router, prefix="/api")
app.include_router(habits_router, prefix="/api")
app.include_router(progress_router, prefix="/api")
app.include_router(share_router, prefix="/api")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "database": "connected"
    }

@app.get("/api/")
async def root():
    return {
        "message": "CouplesWorkout API", 
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)