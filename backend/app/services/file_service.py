"""
文件操作服务
"""
import re
from typing import List, Optional
from ..config.settings import settings
from ..core import FileOperationError


class FileService:
    """文件操作服务类"""
    
    def __init__(self):
        self.notes_dir = settings.notes_dir
        self.notes_dir.mkdir(exist_ok=True)
    
    def save_note_to_file(self, title: str, content: str, category: str, tags: List[str]) -> str:
        """保存笔记到文件"""
        try:
            safe_title = self._sanitize_title(title)
            safe_category = self._sanitize_dirname(category)
            filename = f"{safe_title}.md"
            filepath = self.notes_dir / safe_category / filename
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            # 处理文件名重复问题
            counter = 1
            while filepath.exists():
                filename = f"{safe_title}_{counter}.md"
                filepath = self.notes_dir / safe_category / filename
                counter += 1
                # 防止无限循环
                if counter > 1000:
                    import time
                    filename = f"{safe_title}_{int(time.time())}.md"
                    filepath = self.notes_dir / safe_category / filename
                    break
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"# {safe_title}\n")
                f.write(f"**分类：** {safe_category}\n")
                if tags:
                    f.write(f"**标签：** {', '.join(tags)}\n")
                f.write("\n")
                f.write(content)
            
            return str(filepath.relative_to(self.notes_dir))
        except Exception as e:
            raise FileOperationError(f"保存文件失败: {str(e)}") from e
    
    def update_note_file(self, original_relative_path: Optional[str], title: str, 
                        content: str, category: str, tags: List[str]) -> str:
        """更新笔记文件"""
        try:
            new_rel_path = self.save_note_to_file(title, content, category, tags)
            
            # 如果路径变化，删除旧文件
            if original_relative_path and original_relative_path != new_rel_path:
                old_abs = self.notes_dir / original_relative_path
                if old_abs.exists():
                    old_abs.unlink(missing_ok=True)
            
            return new_rel_path
        except Exception as e:
            raise FileOperationError(f"更新文件失败: {str(e)}") from e
    
    def delete_note_file(self, relative_path: str) -> None:
        """删除笔记文件"""
        try:
            if relative_path:
                abs_path = self.notes_dir / relative_path
                if abs_path.exists():
                    abs_path.unlink(missing_ok=True)
        except Exception as e:
            # 文件删除失败不影响主流程
            print(f"删除文件失败: {e}")
    
    def _sanitize_title(self, raw_title: str) -> str:
        """规范化标题"""
        txt = (raw_title or "").strip()
        
        # 处理JSON格式的标题
        if txt.startswith("{") and ":" in txt:
            try:
                import json
                obj = json.loads(txt)
                if isinstance(obj, dict) and obj.get("title"):
                    txt = str(obj.get("title")).strip()
            except Exception:
                pass
        
        # 替换非法字符
        txt = re.sub(r'[<>:"/\\|?*\u0000-\u001F]', '_', txt)
        txt = txt.strip(' .\t')
        
        if not txt:
            txt = "未命名"
        
        if len(txt) > 120:
            txt = txt[:120]
        
        return txt
    
    def _sanitize_dirname(self, raw_name: str) -> str:
        """规范化目录名"""
        name = (raw_name or "其他").strip()
        name = re.sub(r'[<>:"/\\|?*\u0000-\u001F]', '_', name)
        name = name.strip(' .\t') or "其他"
        return name


# 全局文件服务实例
file_service = FileService()
