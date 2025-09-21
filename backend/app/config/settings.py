"""
应用配置管理
"""
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field


class Settings(BaseModel):
    """应用配置"""
    
    # 应用基础配置
    app_name: str = "智能笔记管理器"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # 安全配置
    secret_key: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7天
    
    # 数据库配置
    database_url: str = Field(default="sqlite:///./data/notes.db", env="DATABASE_URL")
    
    # AI配置
    default_model: str = Field(default="Qwen3-Next-80B-A3B-Instruct", env="DEFAULT_MODEL")
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_base_url: Optional[str] = Field(default=None, env="OPENAI_BASE_URL")
    
    # 文件存储配置
    data_dir: Path = Field(default=Path("data"), env="DATA_DIR")
    notes_dir: Path = Field(default=Path("notes"), env="NOTES_DIR")
    prompt_file: Path = Field(default=Path("data/prompts.txt"), env="PROMPT_FILE")
    
    # 服务器配置
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=True, env="RELOAD")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 确保目录存在
        if isinstance(self.data_dir, Path):
            self.data_dir.mkdir(exist_ok=True)
        if isinstance(self.notes_dir, Path):
            self.notes_dir.mkdir(exist_ok=True)


# 全局配置实例
settings = Settings()
