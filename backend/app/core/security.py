"""
安全相关功能
"""
import hashlib
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from ..config import settings


# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str) -> Optional[dict]:
    """验证令牌"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except Exception:
        return None


def hash_api_config(api_url: str, api_key: str) -> str:
    """哈希API配置"""
    config_string = f"{api_url}|{api_key}"
    return hashlib.sha256(config_string.encode()).hexdigest()
