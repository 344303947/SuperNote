"""
API v1 模块
"""
from .auth import router as auth_router
from .notes import router as notes_router
from .ai import router as ai_router

__all__ = ["auth_router", "notes_router", "ai_router"]
