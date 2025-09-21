@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==========================================
REM 智能笔记管理器 - 简化打包脚本
REM ==========================================

set ROOT=%~dp0
cd /d "%ROOT%"

REM 设置版本号
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "VERSION=%dt:~0,8%"
set "RELEASE_DIR=release\note-ai-manager-v%VERSION%"

echo [INFO] 开始打包生产版本 v%VERSION%...

REM 清理并创建发布目录
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%" 2>nul

REM 构建CSS
echo [INFO] 构建CSS...
call npm run build-css-prod

REM 复制必要文件
echo [INFO] 复制文件...
xcopy /E /I /Y "backend" "%RELEASE_DIR%\backend"
xcopy /E /I /Y "frontend" "%RELEASE_DIR%\frontend"
copy /Y "index.html" "%RELEASE_DIR%\"
copy /Y "favicon.*" "%RELEASE_DIR%\"
copy /Y "package.json" "%RELEASE_DIR%\"
copy /Y "requirements.txt" "%RELEASE_DIR%\"

REM 复制数据文件
if exist "data" xcopy /E /I /Y "data" "%RELEASE_DIR%\data"
if exist "notes" xcopy /E /I /Y "notes" "%RELEASE_DIR%\notes"

REM 创建启动脚本
echo @echo off > "%RELEASE_DIR%\start.bat"
echo python -m venv .venv >> "%RELEASE_DIR%\start.bat"
echo call .venv\Scripts\activate >> "%RELEASE_DIR%\start.bat"
echo pip install -r requirements.txt >> "%RELEASE_DIR%\start.bat"
echo uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 >> "%RELEASE_DIR%\start.bat"
echo pause >> "%RELEASE_DIR%\start.bat"

echo [INFO] 打包完成！发布目录: %RELEASE_DIR%
echo [INFO] 运行 %RELEASE_DIR%\start.bat 启动应用

endlocal
pause
