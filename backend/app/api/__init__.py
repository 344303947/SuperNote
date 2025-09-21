"""
API模块
"""
from .deps import get_ai_service, get_optional_ai_service
from .v1 import auth_router, notes_router, ai_router

__all__ = ["get_ai_service", "get_optional_ai_service", "auth_router", "notes_router", "ai_router"]
