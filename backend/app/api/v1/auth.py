"""
认证相关API路由
"""
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from ..deps import get_ai_service
from ...schemas import LoginRequest, LoginResponse, LogoutResponse, ConfigResponse
from ...services.ai_service import ai_service
from ...core import AIConfigurationError, AIConnectionError, create_http_exception

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, response: Response):
    """用户登录"""
    try:
        # 初始化AI客户端
        ai_service.initialize_client(login_data.api_url, login_data.api_key, login_data.model)
        
        # 保存到Cookie，包含模型名称
        response.set_cookie(
            key="api_config",
            value=f"{login_data.api_url}|{login_data.api_key}|{login_data.model}",
            httponly=True,
            max_age=60 * 60 * 24 * 7,  # 7天
            secure=False,  # 本地开发环境
            samesite="Lax"
        )
        
        return LoginResponse(message="登录成功")
    except (AIConfigurationError, AIConnectionError) as e:
        raise create_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"登录失败: {str(e)}")


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    """用户退出登录"""
    # 清理AI客户端
    ai_service.client = None
    
    # 删除Cookie
    for secure_flag in (False, True):
        try:
            response.delete_cookie(
                key="api_config",
                httponly=True,
                secure=secure_flag,
                samesite="Lax",
                path="/"
            )
        except Exception:
            pass
    
    return LogoutResponse(message="已退出登录")


@router.get("/config", response_model=ConfigResponse)
async def get_config(request: Request):
    """获取配置信息"""
    cookie = request.cookies.get("api_config")
    if not cookie:
        return ConfigResponse(
            api_url="", 
            api_key="", 
            logged_in=False, 
            default_model="Qwen3-Next-80B-A3B-Instruct"
        )
    
    try:
        # 解析Cookie格式：url|key|model
        parts = cookie.split("|")
        if len(parts) < 2:
            return ConfigResponse(
                api_url="", 
                api_key="", 
                logged_in=False, 
                default_model="Qwen3-Next-80B-A3B-Instruct"
            )
        
        url = parts[0].strip()
        key = parts[1].strip()
        model = parts[2].strip() if len(parts) > 2 and parts[2].strip() else "Qwen3-Next-80B-A3B-Instruct"
        
        if not url or not key:
            return ConfigResponse(
                api_url="", 
                api_key="", 
                logged_in=False, 
                default_model=model
            )
        
        # 验证API配置是否有效
        try:
            ai_service.initialize_client(url, key, model)
            return ConfigResponse(
                api_url=url, 
                api_key=key, 
                logged_in=True, 
                default_model=model
            )
        except Exception:
            return ConfigResponse(
                api_url=url, 
                api_key=key, 
                logged_in=False, 
                default_model=model
            )
    except Exception:
        return ConfigResponse(
            api_url="", 
            api_key="", 
            logged_in=False, 
            default_model="Qwen3-Next-80B-A3B-Instruct"
        )
