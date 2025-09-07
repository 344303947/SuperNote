# main.py
import os
import sqlite3
import json
import re
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Depends, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext
from openai import OpenAI
import hashlib

# -----------------------------
# 配置
# -----------------------------
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# 默认模型（可根据需要调整）
DEFAULT_MODEL = "qwen3:30b-40k"
CURRENT_MODEL = DEFAULT_MODEL

# 目录
DATA_DIR = Path("data")
NOTES_DIR = Path("notes")
NOTES_DIR.mkdir(exist_ok=True)

# 数据库
DB_PATH = DATA_DIR / "notes.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
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
conn.commit()

# AI 客户端
client = None
api_key = None
api_url = None

# -----------------------------
# 模型定义
# -----------------------------
class Note(BaseModel):
    title: str
    content: str
    category: str = ""
    tags: str = ""

class LoginRequest(BaseModel):
    api_url: str
    api_key: str
    model: str = DEFAULT_MODEL

class SearchRequest(BaseModel):
    query: str

class OptimizeRequest(BaseModel):
    content: str
    prompt: Optional[str] = None

class UpdateNoteRequest(BaseModel):
    id: int
    title: Optional[str] = None
    content: Optional[str] = None

# -----------------------------
# 工具函数
# -----------------------------
def get_ai_client(request: Request):
    """获取可用的 AI 客户端；若全局未初始化且请求携带 Cookie，则尝试按需重建。"""
    global client, api_key, api_url
    if client is not None and api_key and api_url:
        return client
    # 尝试从 Cookie 重建
    cookie = None
    try:
        cookie = request.cookies.get("api_config")
    except Exception:
        cookie = None
    if cookie:
        try:
            url, key = cookie.split("|", 1)
            url = url.strip()
            key = key.strip()
            if url and key:
                rebuilt = OpenAI(api_key=key, base_url=url)
                # 轻量校验
                rebuilt.models.list()
                client = rebuilt
                api_url = url
                api_key = key
                return client
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"AI 客户端重建失败：{str(e)}")
    raise HTTPException(status_code=400, detail="未配置 AI API")

def extract_category_and_tags(content: str) -> tuple:
    """使用 AI 分析内容，返回分类和标签"""
    try:
        response = client.chat.completions.create(
            model=CURRENT_MODEL,
            messages=[
                {"role": "system", "content": """
                    你是一个智能笔记分类助手。
                    请根据以下笔记内容，提取一个主要分类（如：技术、生活、学习、项目、会议）和 1-3 个标签（如：Python, AI, 2024）。
                    输出格式必须为 JSON，如：
                    {"category": "技术", "tags": ["Python", "AI"]}
                """},
                {"role": "user", "content": content[:1000]}  # 限长
            ],
            temperature=0.3,
            max_tokens=200
        )
        result = json.loads(response.choices[0].message.content.strip())
        return result["category"], result["tags"]
    except Exception as e:
        print("AI 分析失败:", e)
        return "其他", ["未分类"]

def save_note_to_file(title: str, content: str, category: str, tags: str):
    safe_title = title.replace('/', '_').replace('\\', '_')
    filename = f"{safe_title}.md"
    filepath = NOTES_DIR / category / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n")
        f.write(f"**分类：** {category}\n")
        if tags:
            f.write(f"**标签：** {', '.join(tags)}\n")
        f.write("\n")
        f.write(content)
    return str(filepath.relative_to(NOTES_DIR))

def update_note_file(original_relative_path: Optional[str], title: str, content: str, category: str, tags: str):
    """根据可能变化的分类与标题，写入新文件。如果路径变化，删除旧文件。返回新的相对路径。"""
    new_rel_path = save_note_to_file(title, content, category, tags)
    try:
        if original_relative_path and original_relative_path != new_rel_path:
            old_abs = NOTES_DIR / original_relative_path
            if old_abs.exists():
                old_abs.unlink(missing_ok=True)
    except Exception as e:
        print("删除旧文件失败:", e)
    return new_rel_path

def search_notes(query: str) -> List[dict]:
    cursor.execute("""
        SELECT id, title, category, tags, filename, created_at
        FROM notes
        WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? OR category LIKE ?
    """, (f"%{query}%", f"%{query}%", f"%{query}%", f"%{query}%"))
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row[0],
            "title": row[1],
            "category": row[2],
            "tags": row[3],
            "filename": row[4],
            "created_at": row[5]
        })
    return results

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()
#app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 临时保存配置（生产环境建议用数据库或环境变量）
config_cache = {}

# -----------------------------
# 路由
# -----------------------------
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return HTMLResponse(content=open("frontend.html", "r", encoding="utf-8").read())

@app.post("/api/login")
async def login(login_data: LoginRequest, response: Response):
    global api_key, api_url, client, CURRENT_MODEL
    api_key = login_data.api_key.strip()
    api_url = login_data.api_url.strip()
    CURRENT_MODEL = (login_data.model or DEFAULT_MODEL).strip() or DEFAULT_MODEL
    if not api_key or not api_url:
        raise HTTPException(status_code=400, detail="API key 或 URL 不能为空")

    # 验证连接
    try:
        client = OpenAI(api_key=api_key, base_url=api_url)
        client.models.list()  # 测试连接
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"API 连接失败: {str(e)}")

    # 保存到 Cookie
    response.set_cookie(
        key="api_config",
        value=f"{api_url}|{api_key}",
        httponly=True,
        max_age=60 * 60 * 24 * 7,  # 7天
        secure=False,  # 本地开发环境下使用 http，故不设置 Secure
        samesite="Lax"
    )
    return {"message": "登录成功"}

@app.post("/api/logout")
async def logout(response: Response):
    # 删除保存配置的 Cookie，并清理会话内存变量
    global client, api_key, api_url
    client = None
    api_key = None
    api_url = None

    # 兼容不同 Secure/Path 组合，确保删除
    for secure_flag in (False, True):
        try:
            response.delete_cookie(
                key="api_config",
                httponly=True,
                secure=secure_flag,
                samesite="Lax",
                path="/"
            )
        except Exception:
            pass
    return {"message": "已退出登录"}

@app.get("/api/config")
async def get_config(request: Request):
    cookie = request.cookies.get("api_config")
    if not cookie:
        return {"api_url": "", "api_key": "", "logged_in": False, "default_model": CURRENT_MODEL}
    try:
        url, key = cookie.split("|", 1)
        return {"api_url": url, "api_key": key, "logged_in": True, "default_model": CURRENT_MODEL}
    except:
        return {"api_url": "", "api_key": "", "logged_in": False, "default_model": CURRENT_MODEL}

@app.post("/api/note")
async def create_note(note: Note, request: Request):
    # 确保 AI 客户端可用（支持从 Cookie 自动重建）
    _ = get_ai_client(request)

    # 自动分析
    category, tags = extract_category_and_tags(note.content)
    if not note.category:
        note.category = category

    # 保存到数据库
    filename = save_note_to_file(note.title, note.content, note.category, tags)
    cursor.execute("""
        INSERT INTO notes (title, content, category, tags, filename)
        VALUES (?, ?, ?, ?, ?)
    """, (note.title, note.content, note.category, ",".join(tags), filename))
    conn.commit()

    return {"message": "笔记保存成功", "filename": filename}

@app.put("/api/note")
async def update_note(req: UpdateNoteRequest, request: Request):
    """更新笔记内容（可选更新标题）。会重新用 AI 提取分类与标签并更新存储文件。"""
    _ = get_ai_client(request)

    cursor.execute("SELECT id, title, content, category, tags, filename FROM notes WHERE id = ?", (req.id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="笔记不存在")

    current_title = row[1] or ""
    current_content = row[2] or ""
    current_category = row[3] or ""
    current_tags = row[4] or ""
    original_filename = row[5] or ""

    new_title = req.title if (req.title is not None and req.title.strip() != "") else current_title
    new_content = req.content if (req.content is not None) else current_content

    # 重新分析分类与标签
    category, tags_list = extract_category_and_tags(new_content)
    tags_str = ",".join(tags_list)

    # 写入文件（并删除旧文件如路径变化）
    new_rel_path = update_note_file(original_filename, new_title, new_content, category, tags_list)

    # 更新数据库
    cursor.execute(
        """
        UPDATE notes
        SET title = ?, content = ?, category = ?, tags = ?, filename = ?
        WHERE id = ?
        """,
        (new_title, new_content, category, tags_str, new_rel_path, req.id)
    )
    conn.commit()

    return {"message": "更新成功", "id": req.id}

@app.get("/api/search")
async def search(query: str):
    if not query:
        return []
    results = search_notes(query)
    return results

@app.get("/api/notes")
async def list_notes():
    cursor.execute("SELECT id, title, category, tags, filename, created_at FROM notes ORDER BY created_at DESC")
    return [
        {"id": r[0], "title": r[1], "category": r[2], "tags": r[3] or "", "filename": r[4], "created_at": r[5]}
        for r in cursor.fetchall()
    ]

@app.get("/api/notes/by_category")
async def list_notes_by_category(category: str):
    cursor.execute(
        "SELECT id, title, category, tags, filename, created_at FROM notes WHERE category = ? ORDER BY created_at DESC",
        (category,)
    )
    return [
        {"id": r[0], "title": r[1], "category": r[2], "tags": r[3] or "", "filename": r[4], "created_at": r[5]}
        for r in cursor.fetchall()
    ]

@app.get("/api/notes/by_tag")
async def list_notes_by_tag(tag: str):
    # 简单包含匹配，考虑到 tags 为逗号分隔字符串
    like_expr = f"%{tag}%"
    cursor.execute(
        "SELECT id, title, category, tags, filename, created_at FROM notes WHERE tags LIKE ? ORDER BY created_at DESC",
        (like_expr,)
    )
    # 进一步在 Python 侧精确匹配（按逗号拆分去空白）
    rows = cursor.fetchall()
    results = []
    for r in rows:
        raw_tags = r[3] or ""
        split_tags = [t.strip() for t in raw_tags.split(',') if t.strip()]
        if tag in split_tags:
            results.append({
                "id": r[0], "title": r[1], "category": r[2], "tags": raw_tags, "filename": r[4], "created_at": r[5]
            })
    return results

@app.get("/api/stats")
async def stats():
    # 分类统计
    cursor.execute("SELECT category, COUNT(1) FROM notes GROUP BY category")
    cat_counts = [{"name": r[0] or "其他", "count": r[1]} for r in cursor.fetchall()]
    # 标签统计（需要在 Python 里拆分）
    cursor.execute("SELECT tags FROM notes WHERE tags IS NOT NULL AND tags != ''")
    tag_counter = {}
    for (tags_str,) in cursor.fetchall():
        for t in [x.strip() for x in tags_str.split(',') if x.strip()]:
            tag_counter[t] = tag_counter.get(t, 0) + 1
    tag_counts = [{"name": k, "count": v} for k, v in tag_counter.items()]
    # 排序并限制数量
    cat_counts.sort(key=lambda x: x["count"], reverse=True)
    tag_counts.sort(key=lambda x: x["count"], reverse=True)
    return {"categories": cat_counts[:100], "tags": tag_counts[:200]}

@app.post("/api/optimize")
async def optimize_text(req: OptimizeRequest, request: Request):
    """调用大模型同时进行正文优化并生成标题，允许自定义提示词。
    期望模型输出 JSON：{"title": "...", "content": "..."}
    """
    _ = get_ai_client(request)

    base_prompt = (req.prompt or "帮助用户完善笔记文档，并整理归类总结").strip()
    try:
        response = client.chat.completions.create(
            model=CURRENT_MODEL,
            messages=[
                {"role": "system", "content": (
                    "你是一个专业的中文写作与知识整理助手。请在忠实原意的前提下优化表达、结构与条理；"
                    "同时为文章生成一个10-20字的简洁中文标题。"
                )},
                {"role": "user", "content": (
                    "请严格输出JSON（不要解释），格式如下：\n"
                    '{"title":"示例标题","content":"示例优化正文"}\n\n'
                    f"提示：{base_prompt}\n\n原文：\n{req.content[:8000]}"
                )}
            ],
            temperature=0.3,
            max_tokens=2048
        )
        raw = response.choices[0].message.content.strip()
        title = ""
        optimized = raw
        try:
            obj = json.loads(raw)
            title = (obj.get("title") or "").strip()
            optimized = (obj.get("content") or "").strip()
        except Exception:
            # 兼容非 JSON 输出：取首行为标题，全文为优化内容
            lines = [x.strip() for x in raw.splitlines() if x.strip()]
            if lines:
                title = lines[0][:20]
        return {"title": title, "optimized": optimized}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"优化失败: {str(e)}")

@app.get("/api/note")
async def get_note(id: int):
    cursor.execute("SELECT id, title, content, category, tags, filename, created_at FROM notes WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return {
        "id": row[0],
        "title": row[1],
        "content": row[2] or "",
        "category": row[3] or "",
        "tags": row[4] or "",
        "filename": row[5] or "",
        "created_at": row[6]
    }

@app.delete("/api/note")
async def delete_note(id: int):
    """删除一条笔记记录，并删除其对应的存储文件（如存在）。"""
    # 查询现有记录
    cursor.execute("SELECT filename FROM notes WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="笔记不存在")
    rel_path = row[0] or ""

    # 删除数据库记录
    cursor.execute("DELETE FROM notes WHERE id = ?", (id,))
    conn.commit()

    # 删除文件
    try:
        if rel_path:
            abs_path = NOTES_DIR / rel_path
            if abs_path.exists():
                abs_path.unlink(missing_ok=True)
    except Exception:
        # 文件删除失败不影响主流程
        pass
    return {"message": "已删除", "id": id}

# -----------------------------
# 启动命令
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)