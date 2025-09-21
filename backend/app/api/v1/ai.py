"""
AI相关API路由
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from ..deps import get_ai_service
from ...schemas import OptimizeRequest, OptimizeResponse
from ...services.ai_service import ai_service
from ...core import AIConfigurationError, AIConnectionError, create_http_exception

router = APIRouter()


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_text(optimize_data: OptimizeRequest, request: Request):
    """AI优化文本"""
    try:
        # 获取AI服务
        ai_svc = get_ai_service(request)
        
        # 执行优化
        result = ai_svc.optimize_text(optimize_data.content, optimize_data.prompt)
        
        return OptimizeResponse(**result)
    except (AIConfigurationError, AIConnectionError) as e:
        raise create_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"优化失败: {str(e)}")
