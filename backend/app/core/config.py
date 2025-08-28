from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = "CouplesWorkout"
    DEBUG: bool = True
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://couples_user:couples_password@localhost:5432/couples_db"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    class Config:
        env_file = Path(__file__).parent.parent.parent / ".env"
        case_sensitive = True

settings = Settings()