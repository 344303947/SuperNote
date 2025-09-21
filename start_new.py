#!/usr/bin/env python3
"""
新的启动脚本 - 使用重构后的架构
"""
import sys
import os
from pathlib import Path

# 添加backend目录到Python路径
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# 设置环境变量
os.environ.setdefault("PYTHONPATH", str(backend_path))

if __name__ == "__main__":
    try:
        from backend.app.main import app
        import uvicorn
        
        print("🚀 启动智能笔记管理系统 (重构版)")
        print("📁 后端目录:", backend_path)
        print("🌐 访问地址: http://127.0.0.1:8000")
        print("=" * 50)
        
        uvicorn.run(
            "backend.app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[str(backend_path)]
        )
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保已安装所有依赖: pip install -r backend/requirements.txt")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
