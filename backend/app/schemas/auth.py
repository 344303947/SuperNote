"""
认证相关的数据模式
"""
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登录请求模式"""
    api_url: str = Field(..., description="API地址")
    api_key: str = Field(..., description="API密钥")
    model: str = Field(default="Qwen3-Next-80B-A3B-Instruct", description="模型名称")


class LoginResponse(BaseModel):
    """登录响应模式"""
    message: str = Field(..., description="响应消息")


class LogoutResponse(BaseModel):
    """退出登录响应模式"""
    message: str = Field(..., description="响应消息")


class ConfigResponse(BaseModel):
    """配置响应模式"""
    api_url: str = Field(..., description="API地址")
    api_key: str = Field(..., description="API密钥")
    logged_in: bool = Field(..., description="是否已登录")
    default_model: str = Field(..., description="默认模型")
