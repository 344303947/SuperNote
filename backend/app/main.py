"""
FastAPI应用主入口
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from .config import settings
from .api.v1 import auth_router, notes_router, ai_router

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="智能笔记管理系统 - AI自动分类，自动优化，一键存储，全文搜索"
)

# 挂载静态文件
frontend_dir = BASE_DIR / "frontend"
if frontend_dir.exists():
    app.mount("/frontend", StaticFiles(directory=str(frontend_dir)), name="frontend")

# 挂载前端js文件夹
frontend_js_dir = BASE_DIR / "frontend" / "js"
if frontend_js_dir.exists():
    app.mount("/js", StaticFiles(directory=str(frontend_js_dir)), name="js")

# 注册路由
app.include_router(auth_router, prefix="/api", tags=["认证"])
app.include_router(notes_router, prefix="/api", tags=["笔记"])
app.include_router(ai_router, prefix="/api", tags=["AI"])

# 为了兼容性，同时注册v1版本的路由
app.include_router(auth_router, prefix="/api/v1", tags=["认证v1"])
app.include_router(notes_router, prefix="/api/v1", tags=["笔记v1"])
app.include_router(ai_router, prefix="/api/v1", tags=["AIv1"])


@app.get("/", response_class=HTMLResponse)
async def home():
    """主页"""
    try:
        index_file = BASE_DIR / "index.html"
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>页面未找到</h1>")


@app.get("/frontend/styles.css")
async def get_styles():
    """获取样式文件"""
    styles_file = BASE_DIR / "frontend" / "styles.css"
    return FileResponse(str(styles_file))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
