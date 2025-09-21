"""
依赖注入
"""
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException
from ..services.ai_service import ai_service
from ..core import AIConfigurationError


def get_ai_service(request: Request):
    """获取AI服务"""
    # 尝试从Cookie重建AI客户端
    cookie = request.cookies.get("api_config")
    if not cookie:
        raise HTTPException(status_code=400, detail="未配置 AI API")
    
    try:
        # 解析Cookie，支持新的格式：url|key|model
        parts = cookie.split("|")
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="AI API配置格式错误")
        
        url = parts[0].strip()
        key = parts[1].strip()
        # 如果提供了模型名称，使用它；否则使用默认模型
        model = parts[2].strip() if len(parts) > 2 and parts[2].strip() else "gpt-3.5-turbo"
        
        if not url or not key:
            raise HTTPException(status_code=400, detail="未配置 AI API")
        
        # 初始化AI客户端
        ai_service.initialize_client(url, key, model)
        return ai_service
    except HTTPException:
        raise
    except Exception as e:
        if isinstance(e, AIConfigurationError):
            raise HTTPException(status_code=400, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=f"AI 客户端重建失败：{str(e)}")


def get_optional_ai_service(request: Request) -> Optional[Any]:
    """获取可选的AI服务"""
    try:
        return get_ai_service(request)
    except HTTPException:
        return None
