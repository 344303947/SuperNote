# 智能笔记管理器（note-ai-manager）

一个基于 FastAPI + 原生前端的本地可用「智能笔记」应用：

- AI 自动分析笔记内容并提取「分类、标签」
- 一键 AI 优化正文并生成标题
- 笔记保存到 SQLite 与本地 Markdown 文件，支持全文搜索
- 词云展示热门分类与标签，点击可筛选
- 前后端本地运行，默认无需外网（可接入兼容 OpenAI 的本地/远程模型）


## 功能特性

- 自动分类与标签：调用兼容 OpenAI 的 API，根据正文智能归类并打标签
- 文本优化与标题生成：一键清洗优化内容并生成 10–20 字中文标题
- 全文检索与条件过滤：支持搜索、按分类/标签过滤
- 本地持久化：SQLite 数据库 + `notes/分类/标题.md` 文件
- 纯前端页面：无需构建，打开即可用


## 目录结构

```text
note-ai-manager/
  ├─ main.py                # FastAPI 后端与所有接口
  ├─ frontend.html          # 单页前端（Tailwind + 原生 JS）
  ├─ requirements.txt       # 依赖
  ├─ data/notes.db          # SQLite 数据库（首次运行自动创建）
  └─ notes/                 # Markdown 文件按分类分目录存放
```


## 环境要求

- Python 3.10 或更高版本
- 可访问一个兼容 OpenAI 的推理服务（任选其一）：
  - 公有云：`https://api.openai.com/v1`（需要有效 Key）
  - 本地/私有：例如 Ollama、OpenAI 兼容网关，提供 `base_url` 与 `api_key`


## 快速开始

```bash
# 1) 创建并激活虚拟环境（可选）
python -m venv .venv
.venv\\Scripts\\activate

# 2) 安装依赖
pip install -r requirements.txt

# 3) 启动服务（默认 http://127.0.0.1:8000）
python main.py
```

打开浏览器访问 `http://127.0.0.1:8000`。


## 前端使用说明

1. 首次进入，先在页面顶部的「API 配置」中填写：
   - API 地址（Base URL），例如：`https://api.openai.com/v1` 或你的本地服务地址
   - API Key
   - 默认模型（如 `qwen3:30b-40k`，可根据你的服务可用模型填写）
2. 登录成功后即可：
   - 新建笔记：输入正文，必要时点击「AI 优化」获取更优表达与标题，然后保存
   - 搜索与筛选：顶部搜索框，右侧词云点击可按分类或标签过滤
   - 预览/优化/更新：点击列表项打开预览，支持再次 AI 优化后保存更新
   - 删除笔记：在预览弹窗中删除


## 后端 API 文档（简要）

> 基础地址：`/api`

- POST `/login`：保存 `api_url`、`api_key`、`model` 到 Cookie 并校验连通
  - 请求体：`{ api_url: string, api_key: string, model?: string }`
  - 响应：`{ message: "登录成功" }`

- POST `/logout`：清理会话与 Cookie
  - 响应：`{ message: "已退出登录" }`

- GET `/config`：读取当前 Cookie 配置
  - 响应：`{ api_url, api_key, logged_in, default_model }`

- POST `/note`：新建笔记（自动提取分类/标签、写入 DB 与 Markdown 文件；也可在请求体中直接指定）
  - 请求体：`{ title: string, content: string, category?: string, tags?: string }`
  - 响应：`{ message: "笔记保存成功", filename }`

- PUT `/note`：更新笔记内容/标题/分类/标签（未显式提供的字段将保留或由 AI 重新推断）
  - 请求体：`{ id: number, title?: string, content?: string, category?: string, tags?: string }`
  - 响应：`{ message: "更新成功", id }`

- DELETE `/note?id=ID`：删除笔记（数据库记录与对应文件）
  - 响应：`{ message: "已删除", id }`

- GET `/note?id=ID`：获取单条笔记详情
  - 响应：`{ id, title, content, category, tags, filename, created_at }`

- GET `/notes`：按时间倒序列出所有笔记
  - 响应：`Array<NoteMeta>`

- GET `/notes/by_category?category=名称`：按分类列出

- GET `/notes/by_tag?tag=名称`：按标签精确匹配列出

- GET `/search?query=关键词`：全文搜索（标题/内容/分类/标签）

- POST `/optimize`：AI 优化正文并生成标题
  - 请求体：`{ content: string, prompt?: string }`
  - 响应：`{ title: string, optimized: string }`

- GET `/categories`：返回已有分类（去重、按频次倒序）
- GET `/tags`：返回已有标签（去重、按频次倒序）


## 数据与存储

- SQLite：文件位于 `data/notes.db`（首次运行自动创建与建表）
  - 表 `notes` 字段：`id, title, content, category, tags, filename, created_at`
- Markdown 文件：保存在 `notes/分类/标题.md`
  - 文件内容：一级标题为标题，首部包含「分类、标签」信息，其后为正文
  - 更新笔记时如分类或标题变化，会自动删除旧文件并写入新路径

### 默认优化提示词

- 文件位置：`data/prompts.txt`
- 用途：当「AI 优化」未传入自定义提示词时，后端会从该文件读取默认提示词。
- 注意：若文件不存在或为空，将回退为简短默认值「帮助用户完善笔记文档，并整理归类总结」。


## 模型与连接说明

后端通过 `openai` SDK 以「兼容 OpenAI」的方式连接任意推理服务：

- Base URL：在前端登录处填写（例如 `http://localhost:11434/v1`）
- API Key：对应服务的密钥（本地服务如允许可填任意占位符）
- 模型名：例如 `qwen3:30b-40k`，需与服务端模型一致

连通性校验：登录时会调用 `models.list()` 验证是否可用。


## 运行与调试

```bash
# 开发模式自动重载
uvicorn main:app --reload

# 指定端口
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```


## 安全与生产建议

- 更换 `main.py` 中的 `SECRET_KEY` 值并转为环境变量管理
- 生产环境使用 HTTPS，并将 Cookie `secure=True`
- 后端设置 IP 访问控制与速率限制（如 Nginx/网关层）
- 为外部 API Key 设置最小权限与定期轮换


## 常见问题（FAQ）

- Q: 登录提示「API 连接失败」？
  - A: 检查 Base URL 与 Key 是否正确，目标服务是否兼容 OpenAI，并确认模型名有效。

- Q: 本地模型怎么配？
  - A: 使用兼容网关（如 Ollama/OpenAI 兼容代理），在登录处填写其 Base URL 与 Key，并选择可用模型名即可。

- Q: 保存后未见到 Markdown 文件？
  - A: 文件写入位置为 `notes/分类/标题.md`，请确认应用进程对该目录有写权限。

- Q: 标签过滤不准？
  - A: 数据库存储为逗号分隔字符串，后端在查询后做了精确匹配过滤；若历史数据格式异常，可手动修正 `tags` 字段或重新保存一次。


## 开发者提示

- 统一通过 `/api` 前缀访问后端接口
- 修改前端无需构建，刷新页面生效
- 如需扩展字段，先更新表结构与 `Note/UpdateNoteRequest` 模型，再调整前端渲染


---

如需我继续完善自动化测试、Dockerfile、或提供一键本地模型（Ollama）对接脚本，请告诉我。


