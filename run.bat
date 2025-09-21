@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Project root
set ROOT=%~dp0
cd /d "%ROOT%"

REM Use Python from PATH
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 未找到 Python，请先安装 Python 并加入 PATH。
  exit /b 1
)

REM Create venv if not exists
if not exist .venv (
  echo [INFO] 创建虚拟环境 .venv ...
  python -m venv .venv
)

REM Upgrade pip
call .venv\Scripts\python -m pip install --upgrade pip >nul

REM Install dependencies
echo [INFO] 安装依赖 ...
call .venv\Scripts\python -m pip install -r requirements.txt || (
  echo [ERROR] 依赖安装失败。
  exit /b 1
)

REM Start app with new architecture
echo [INFO] 启动应用 (新架构) ...
call .venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

endlocal

