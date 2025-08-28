from .auth import router as auth_router
from .users import router as users_router
from .couples import router as couples_router
from .workouts import router as workouts_router
from .habits import router as habits_router
from .progress import router as progress_router
from .share import router as share_router

__all__ = [
    "auth_router",
    "users_router", 
    "couples_router",
    "workouts_router",
    "habits_router",
    "progress_router",
    "share_router"
]