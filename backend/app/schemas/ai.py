"""
AI相关的数据模式
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    """AI优化请求模式"""
    content: str = Field(..., description="要优化的内容")
    prompt: Optional[str] = Field(None, description="自定义提示词")


class OptimizeResponse(BaseModel):
    """AI优化响应模式"""
    title: str = Field(..., description="生成的标题")
    optimized: str = Field(..., description="优化后的内容")
    category: str = Field(..., description="分类")
    tags: str = Field(..., description="标签字符串，逗号分隔")
    key_points: Optional[List[str]] = Field(None, description="关键点")
    graph: Optional[Dict[str, Any]] = Field(None, description="知识图谱")
    mode: str = Field(..., description="优化模式")


class StatsResponse(BaseModel):
    """统计数据响应模式"""
    categories: List[Dict[str, Any]] = Field(..., description="分类统计")
    tags: List[Dict[str, Any]] = Field(..., description="标签统计")
