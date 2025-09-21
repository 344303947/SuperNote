"""
笔记数据访问层
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..config.database import db_manager
from ..core import NoteNotFoundError


class NoteRepository:
    """笔记数据访问类"""
    
    def __init__(self):
        self.db = db_manager
    
    def create_note(self, title: str, content: str, category: str, tags: str, filename: str) -> int:
        """创建笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            INSERT INTO notes (title, content, category, tags, filename)
            VALUES (?, ?, ?, ?, ?)
        """, (title, content, category, tags, filename))
        self.db.get_connection().commit()
        return cursor.lastrowid
    
    def get_note_by_id(self, note_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT id, title, content, category, tags, filename, created_at
            FROM notes WHERE id = ?
        """, (note_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "category": row[3],
            "tags": row[4],
            "filename": row[5],
            "created_at": row[6]
        }
    
    def update_note(self, note_id: int, title: str, content: str, 
                   category: str, tags: str, filename: str) -> bool:
        """更新笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            UPDATE notes
            SET title = ?, content = ?, category = ?, tags = ?, filename = ?
            WHERE id = ?
        """, (title, content, category, tags, filename, note_id))
        self.db.get_connection().commit()
        return cursor.rowcount > 0
    
    def delete_note(self, note_id: int) -> bool:
        """删除笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        self.db.get_connection().commit()
        return cursor.rowcount > 0
    
    def get_all_notes(self) -> List[Dict[str, Any]]:
        """获取所有笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT id, title, category, tags, filename, created_at
            FROM notes ORDER BY created_at DESC
        """)
        return [
            {
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "tags": row[3] or "",
                "filename": row[4],
                "created_at": row[5]
            }
            for row in cursor.fetchall()
        ]
    
    def search_notes(self, query: str) -> List[Dict[str, Any]]:
        """搜索笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT id, title, category, tags, filename, created_at
            FROM notes
            WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? OR category LIKE ?
        """, (f"%{query}%", f"%{query}%", f"%{query}%", f"%{query}%"))
        
        return [
            {
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "tags": row[3] or "",
                "filename": row[4],
                "created_at": row[5]
            }
            for row in cursor.fetchall()
        ]
    
    def get_notes_by_category(self, category: str) -> List[Dict[str, Any]]:
        """根据分类获取笔记"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT id, title, category, tags, filename, created_at
            FROM notes WHERE category = ? ORDER BY created_at DESC
        """, (category,))
        
        return [
            {
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "tags": row[3] or "",
                "filename": row[4],
                "created_at": row[5]
            }
            for row in cursor.fetchall()
        ]
    
    def get_notes_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """根据标签获取笔记"""
        cursor = self.db.get_cursor()
        like_expr = f"%{tag}%"
        cursor.execute("""
            SELECT id, title, category, tags, filename, created_at
            FROM notes WHERE tags LIKE ? ORDER BY created_at DESC
        """, (like_expr,))
        
        # 进一步精确匹配
        rows = cursor.fetchall()
        results = []
        for row in rows:
            raw_tags = row[3] or ""
            split_tags = [t.strip() for t in raw_tags.split(',') if t.strip()]
            if tag in split_tags:
                results.append({
                    "id": row[0],
                    "title": row[1],
                    "category": row[2],
                    "tags": raw_tags,
                    "filename": row[4],
                    "created_at": row[5]
                })
        
        return results
    
    def get_categories_stats(self) -> List[Dict[str, Any]]:
        """获取分类统计"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT category, COUNT(1) FROM notes GROUP BY category
        """)
        return [{"name": r[0] or "其他", "count": r[1]} for r in cursor.fetchall()]
    
    def get_tags_stats(self) -> List[Dict[str, Any]]:
        """获取标签统计"""
        cursor = self.db.get_cursor()
        cursor.execute("SELECT tags FROM notes WHERE tags IS NOT NULL AND tags != ''")
        
        tag_counter = {}
        for (tags_str,) in cursor.fetchall():
            for t in [x.strip() for x in tags_str.split(',') if x.strip()]:
                tag_counter[t] = tag_counter.get(t, 0) + 1
        
        return [{"name": k, "count": v} for k, v in tag_counter.items()]
    
    def get_categories_list(self) -> List[str]:
        """获取分类列表"""
        cursor = self.db.get_cursor()
        cursor.execute("""
            SELECT category, COUNT(1)
            FROM notes
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
        """)
        rows = cursor.fetchall()
        rows.sort(key=lambda r: r[1], reverse=True)
        return [r[0] for r in rows]
    
    def get_tags_list(self) -> List[str]:
        """获取标签列表"""
        cursor = self.db.get_cursor()
        cursor.execute("SELECT tags FROM notes WHERE tags IS NOT NULL AND tags != ''")
        
        counter = {}
        for (tags_str,) in cursor.fetchall():
            for t in [x.strip() for x in tags_str.split(',') if x.strip()]:
                counter[t] = counter.get(t, 0) + 1
        
        return [k for k, _ in sorted(counter.items(), key=lambda kv: kv[1], reverse=True)]


# 全局笔记仓库实例
note_repository = NoteRepository()
