"""
数据库配置和连接管理
"""
import sqlite3
from pathlib import Path
from typing import Optional
from .settings import settings


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.connection: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None
        self._init_database()
    
    def _init_database(self):
        """初始化数据库连接和表结构"""
        # 确保数据目录存在
        settings.data_dir.mkdir(exist_ok=True)
        
        # 连接数据库
        db_path = settings.data_dir / "notes.db"
        
        try:
            # 检查数据库文件权限
            import os
            if db_path.exists():
                if not os.access(str(db_path), os.W_OK):
                    raise PermissionError(f"数据库文件 {db_path} 没有写权限")
            
            # 检查目录权限
            if not os.access(str(settings.data_dir), os.W_OK):
                raise PermissionError(f"数据目录 {settings.data_dir} 没有写权限")
            
            self.connection = sqlite3.connect(str(db_path), check_same_thread=False)
            self.cursor = self.connection.cursor()
            
            # 创建表
            self._create_tables()
            
        except sqlite3.OperationalError as e:
            if "readonly database" in str(e).lower():
                raise PermissionError(f"数据库只读错误: {e}\n请检查文件权限或运行权限修复脚本")
            else:
                raise e
        except PermissionError as e:
            raise e
        except Exception as e:
            raise Exception(f"数据库初始化失败: {e}")
    
    def _create_tables(self):
        """创建数据库表"""
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                tags TEXT,
                filename TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.connection.commit()
    
    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        return self.connection
    
    def get_cursor(self) -> sqlite3.Cursor:
        """获取数据库游标"""
        return self.cursor
    
    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()


# 全局数据库管理器实例
db_manager = DatabaseManager()
