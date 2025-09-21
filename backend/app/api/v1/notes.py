"""
笔记相关API路由
"""
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Query, Depends
from ..deps import get_optional_ai_service
from ...schemas import (
    NoteCreate, NoteUpdate, NoteResponse, NoteListResponse, 
    NoteSearchRequest, NoteFilterRequest
)
from ...services.note_service import note_service
from ...core import NoteNotFoundError, create_http_exception

router = APIRouter()


@router.post("/note", response_model=NoteResponse)
async def create_note(note_data: NoteCreate, request: Request):
    """创建笔记"""
    try:
        return note_service.create_note(note_data, dict(request.cookies))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建笔记失败: {str(e)}")


@router.get("/note", response_model=NoteResponse)
async def get_note(id: int = Query(..., description="笔记ID")):
    """获取笔记详情"""
    try:
        return note_service.get_note(id)
    except NoteNotFoundError as e:
        raise create_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取笔记失败: {str(e)}")


@router.put("/note", response_model=NoteResponse)
async def update_note(note_data: NoteUpdate, request: Request):
    """更新笔记"""
    try:
        return note_service.update_note(note_data.id, note_data, dict(request.cookies))
    except NoteNotFoundError as e:
        raise create_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新笔记失败: {str(e)}")


@router.delete("/note")
async def delete_note(id: int = Query(..., description="笔记ID")):
    """删除笔记"""
    try:
        success = note_service.delete_note(id)
        if not success:
            raise NoteNotFoundError(id)
        return {"message": "已删除", "id": id}
    except NoteNotFoundError as e:
        raise create_http_exception(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除笔记失败: {str(e)}")


@router.get("/notes", response_model=list[NoteListResponse])
async def get_all_notes():
    """获取所有笔记"""
    try:
        return note_service.get_all_notes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取笔记列表失败: {str(e)}")


@router.get("/search", response_model=list[NoteListResponse])
async def search_notes(query: str = Query(..., description="搜索关键词")):
    """搜索笔记"""
    try:
        return note_service.search_notes(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")


@router.get("/notes/by_category", response_model=list[NoteListResponse])
async def get_notes_by_category(category: str = Query(..., description="分类名称")):
    """根据分类获取笔记"""
    try:
        return note_service.get_notes_by_category(category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"按分类获取笔记失败: {str(e)}")


@router.get("/notes/by_tag", response_model=list[NoteListResponse])
async def get_notes_by_tag(tag: str = Query(..., description="标签名称")):
    """根据标签获取笔记"""
    try:
        return note_service.get_notes_by_tag(tag)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"按标签获取笔记失败: {str(e)}")


@router.get("/stats")
async def get_stats():
    """获取统计数据"""
    try:
        return note_service.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计数据失败: {str(e)}")


@router.get("/categories")
async def get_categories():
    """获取分类列表"""
    try:
        return note_service.get_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分类列表失败: {str(e)}")


@router.get("/tags")
async def get_tags():
    """获取标签列表"""
    try:
        return note_service.get_tags()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取标签列表失败: {str(e)}")
