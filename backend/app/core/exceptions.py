"""
自定义异常类
"""
from fastapi import HTTPException
from typing import Any, Dict, Optional


class NoteAIManagerException(Exception):
    """应用基础异常类"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AIConfigurationError(NoteAIManagerException):
    """AI配置错误"""
    def __init__(self, message: str = "AI配置错误"):
        super().__init__(message, 400)


class AIConnectionError(NoteAIManagerException):
    """AI连接错误"""
    def __init__(self, message: str = "AI服务连接失败"):
        super().__init__(message, 400)


class NoteNotFoundError(NoteAIManagerException):
    """笔记未找到错误"""
    def __init__(self, note_id: int):
        super().__init__(f"笔记 {note_id} 不存在", 404)


class FileOperationError(NoteAIManagerException):
    """文件操作错误"""
    def __init__(self, message: str = "文件操作失败"):
        super().__init__(message, 500)


def create_http_exception(exc: NoteAIManagerException) -> HTTPException:
    """将自定义异常转换为HTTP异常"""
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "message": exc.message,
            "details": exc.details
        }
    )
