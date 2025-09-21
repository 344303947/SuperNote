"""
配置模块
"""
from .settings import settings
from .database import db_manager

__all__ = ["settings", "db_manager"]
