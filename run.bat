@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Project root
set ROOT=%~dp0
cd /d "%ROOT%"

REM Use Python from PATH
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] δ�ҵ� Python�����Ȱ�װ Python ������ PATH��
  exit /b 1
)

REM Create venv if not exists
if not exist .venv (
  echo [INFO] �������⻷�� .venv ...
  python -m venv .venv
)

REM Upgrade pip
call .venv\Scripts\python -m pip install --upgrade pip >nul

REM Install dependencies
echo [INFO] ��װ���� ...
call .venv\Scripts\python -m pip install -r requirements.txt || (
  echo [ERROR] ������װʧ�ܡ�
  exit /b 1
)

REM Start app with new architecture
echo [INFO] ����Ӧ�� (�¼ܹ�) ...
call .venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

endlocal

