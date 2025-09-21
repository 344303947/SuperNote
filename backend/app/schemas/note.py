"""
笔记相关的数据模式
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class NoteBase(BaseModel):
    """笔记基础模式"""
    title: str = Field(..., min_length=1, max_length=200, description="笔记标题")
    content: str = Field(..., description="笔记内容")
    category: str = Field(default="", max_length=100, description="分类")
    tags: str = Field(default="", max_length=500, description="标签，逗号分隔")


class NoteCreate(NoteBase):
    """创建笔记模式"""
    pass


class NoteUpdate(BaseModel):
    """更新笔记模式"""
    id: int = Field(..., description="笔记ID")
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="笔记标题")
    content: Optional[str] = Field(None, description="笔记内容")
    category: Optional[str] = Field(None, max_length=100, description="分类")
    tags: Optional[str] = Field(None, max_length=500, description="标签，逗号分隔")


class NoteResponse(NoteBase):
    """笔记响应模式"""
    id: int = Field(..., description="笔记ID")
    filename: str = Field(..., description="文件名")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """笔记列表响应模式"""
    id: int
    title: str
    category: str
    tags: str
    filename: str
    created_at: Optional[datetime]


class NoteSearchRequest(BaseModel):
    """笔记搜索请求模式"""
    query: str = Field(..., min_length=1, max_length=100, description="搜索关键词")


class NoteFilterRequest(BaseModel):
    """笔记过滤请求模式"""
    category: Optional[str] = Field(None, description="按分类过滤")
    tag: Optional[str] = Field(None, description="按标签过滤")
