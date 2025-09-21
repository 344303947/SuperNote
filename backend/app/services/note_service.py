"""
笔记业务服务
"""
from typing import List, Optional, Dict, Any
from ..schemas import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from ..repositories.note_repository import note_repository
from ..services.file_service import file_service
from ..services.ai_service import ai_service
from ..core import NoteNotFoundError


class NoteService:
    """笔记业务服务类"""
    
    def __init__(self):
        self.repository = note_repository
        self.file_service = file_service
        self.ai_service = ai_service
    
    def create_note(self, note_data: NoteCreate, request_cookies: Optional[Dict[str, str]] = None) -> NoteResponse:
        """创建笔记"""
        # 尝试获取AI客户端进行自动分类
        ai_client = None
        if request_cookies and request_cookies.get("api_config"):
            try:
                url, key = request_cookies["api_config"].split("|", 1)
                ai_client = self._get_ai_client(url.strip(), key.strip())
            except Exception:
                pass
        
        # 处理分类和标签
        user_category = (note_data.category or '').strip()
        user_tags_list = self._parse_tags(note_data.tags or '')
        
        if not user_category or not user_tags_list:
            if ai_client:
                # 有AI客户端，进行自动分析
                category, tags = self.ai_service.extract_category_and_tags(note_data.content)
                if not user_category:
                    user_category = category
                if not user_tags_list:
                    user_tags_list = tags
            else:
                # 没有AI客户端，使用默认值
                if not user_category:
                    user_category = "未分类"
                if not user_tags_list:
                    user_tags_list = ["无标签"]
        
        # 保存到文件
        filename = self.file_service.save_note_to_file(
            note_data.title, note_data.content, user_category, user_tags_list
        )
        
        # 保存到数据库
        note_id = self.repository.create_note(
            note_data.title, note_data.content, user_category, 
            ",".join(user_tags_list), filename
        )
        
        # 将tags数组转换为字符串格式
        tags_str = ",".join(user_tags_list) if user_tags_list else ""
        
        return NoteResponse(
            id=note_id,
            title=note_data.title,
            content=note_data.content,
            category=user_category,
            tags=tags_str,
            filename=filename,
            created_at=None  # 数据库会自动设置
        )
    
    def get_note(self, note_id: int) -> NoteResponse:
        """获取笔记详情"""
        note_data = self.repository.get_note_by_id(note_id)
        if not note_data:
            raise NoteNotFoundError(note_id)
        
        # 将tags数组转换为字符串格式
        tags_list = self._parse_tags(note_data["tags"])
        tags_str = ",".join(tags_list) if tags_list else ""
        
        return NoteResponse(
            id=note_data["id"],
            title=note_data["title"],
            content=note_data["content"],
            category=note_data["category"],
            tags=tags_str,
            filename=note_data["filename"],
            created_at=note_data["created_at"]
        )
    
    def update_note(self, note_id: int, note_data: NoteUpdate, 
                   request_cookies: Optional[Dict[str, str]] = None) -> NoteResponse:
        """更新笔记"""
        # 获取现有笔记
        existing_note = self.repository.get_note_by_id(note_id)
        if not existing_note:
            raise NoteNotFoundError(note_id)
        
        # 尝试获取AI客户端
        ai_client = None
        if request_cookies and request_cookies.get("api_config"):
            try:
                url, key = request_cookies["api_config"].split("|", 1)
                ai_client = self._get_ai_client(url.strip(), key.strip())
            except Exception:
                pass
        
        # 确定新值
        new_title = note_data.title if note_data.title is not None else existing_note["title"]
        new_content = note_data.content if note_data.content is not None else existing_note["content"]
        
        # 处理分类和标签
        user_category = (note_data.category or '').strip()
        user_tags_list = self._parse_tags(note_data.tags or '')
        
        if not user_category or not user_tags_list:
            if ai_client:
                # 有AI客户端，进行自动分析
                category, tags_list = self.ai_service.extract_category_and_tags(new_content)
                if not user_category:
                    user_category = category
                if not user_tags_list:
                    user_tags_list = tags_list
            else:
                # 没有AI客户端，保持原有分类和标签
                if not user_category:
                    user_category = existing_note["category"]
                if not user_tags_list:
                    user_tags_list = self._parse_tags(existing_note["tags"])
        
        # 更新文件
        new_rel_path = self.file_service.update_note_file(
            existing_note["filename"], new_title, new_content, user_category, user_tags_list
        )
        
        # 更新数据库
        success = self.repository.update_note(
            note_id, new_title, new_content, user_category, 
            ",".join(user_tags_list), new_rel_path
        )
        
        if not success:
            raise NoteNotFoundError(note_id)
        
        # 将tags数组转换为字符串格式
        tags_str = ",".join(user_tags_list) if user_tags_list else ""
        
        return NoteResponse(
            id=note_id,
            title=new_title,
            content=new_content,
            category=user_category,
            tags=tags_str,
            filename=new_rel_path,
            created_at=existing_note["created_at"]
        )
    
    def delete_note(self, note_id: int) -> bool:
        """删除笔记"""
        # 获取笔记信息
        note_data = self.repository.get_note_by_id(note_id)
        if not note_data:
            raise NoteNotFoundError(note_id)
        
        # 删除数据库记录
        success = self.repository.delete_note(note_id)
        if not success:
            return False
        
        # 删除文件
        self.file_service.delete_note_file(note_data["filename"])
        
        return True
    
    def get_all_notes(self) -> List[NoteListResponse]:
        """获取所有笔记列表"""
        notes = self.repository.get_all_notes()
        return [
            NoteListResponse(
                id=note["id"],
                title=note["title"],
                category=note["category"],
                tags=note["tags"],
                filename=note["filename"],
                created_at=note["created_at"]
            )
            for note in notes
        ]
    
    def search_notes(self, query: str) -> List[NoteListResponse]:
        """搜索笔记"""
        notes = self.repository.search_notes(query)
        return [
            NoteListResponse(
                id=note["id"],
                title=note["title"],
                category=note["category"],
                tags=note["tags"],
                filename=note["filename"],
                created_at=note["created_at"]
            )
            for note in notes
        ]
    
    def get_notes_by_category(self, category: str) -> List[NoteListResponse]:
        """根据分类获取笔记"""
        notes = self.repository.get_notes_by_category(category)
        return [
            NoteListResponse(
                id=note["id"],
                title=note["title"],
                category=note["category"],
                tags=note["tags"],
                filename=note["filename"],
                created_at=note["created_at"]
            )
            for note in notes
        ]
    
    def get_notes_by_tag(self, tag: str) -> List[NoteListResponse]:
        """根据标签获取笔记"""
        notes = self.repository.get_notes_by_tag(tag)
        return [
            NoteListResponse(
                id=note["id"],
                title=note["title"],
                category=note["category"],
                tags=note["tags"],
                filename=note["filename"],
                created_at=note["created_at"]
            )
            for note in notes
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计数据"""
        categories = self.repository.get_categories_stats()
        tags = self.repository.get_tags_stats()
        
        # 排序并限制数量
        categories.sort(key=lambda x: x["count"], reverse=True)
        tags.sort(key=lambda x: x["count"], reverse=True)
        
        return {
            "categories": categories[:100],
            "tags": tags[:200]
        }
    
    def get_categories(self) -> List[str]:
        """获取分类列表"""
        return self.repository.get_categories_list()
    
    def get_tags(self) -> List[str]:
        """获取标签列表"""
        return self.repository.get_tags_list()
    
    def _parse_tags(self, tags_value: str) -> List[str]:
        """解析标签字符串"""
        if not tags_value:
            return []
        
        # 兼容JSON数组格式
        txt = str(tags_value).strip()
        try:
            if txt.startswith('[') and txt.endswith(']'):
                import json
                arr = json.loads(txt)
                if isinstance(arr, list):
                    return [str(x).strip() for x in arr if str(x).strip()]
        except Exception:
            pass
        
        return [t.strip() for t in txt.split(',') if t.strip()]
    
    def _get_ai_client(self, api_url: str, api_key: str):
        """获取AI客户端"""
        try:
            # 初始化AI服务客户端
            self.ai_service.initialize_client(api_url, api_key, "Qwen3-Next-80B-A3B-Instruct")
            return self.ai_service
        except Exception:
            return None


# 全局笔记服务实例
note_service = NoteService()
