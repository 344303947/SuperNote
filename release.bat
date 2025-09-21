@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==========================================
REM 智能笔记管理器 - 生产版本打包脚本
REM ==========================================

REM 设置项目根目录
set ROOT=%~dp0
cd /d "%ROOT%"

REM 设置版本号和发布时间
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "VERSION=%YYYY%%MM%%DD%_%HH%%Min%"
set "RELEASE_DIR=release\note-ai-manager-v%VERSION%"

echo [INFO] 开始打包生产版本 v%VERSION%...
echo [INFO] 发布目录: %RELEASE_DIR%

REM 检查Python环境
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 未找到 Python，请先安装 Python 并加入 PATH。
  exit /b 1
)

REM 检查Node.js环境
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 未找到 Node.js，请先安装 Node.js 并加入 PATH。
  exit /b 1
)

REM 清理旧的发布目录
if exist "%RELEASE_DIR%" (
  echo [INFO] 清理旧的发布目录...
  rmdir /s /q "%RELEASE_DIR%"
)

REM 创建发布目录结构
echo [INFO] 创建发布目录结构...
mkdir "%RELEASE_DIR%" 2>nul
mkdir "%RELEASE_DIR%\backend" 2>nul
mkdir "%RELEASE_DIR%\backend\app" 2>nul
mkdir "%RELEASE_DIR%\backend\app\api" 2>nul
mkdir "%RELEASE_DIR%\backend\app\api\v1" 2>nul
mkdir "%RELEASE_DIR%\backend\app\config" 2>nul
mkdir "%RELEASE_DIR%\backend\app\core" 2>nul
mkdir "%RELEASE_DIR%\backend\app\models" 2>nul
mkdir "%RELEASE_DIR%\backend\app\repositories" 2>nul
mkdir "%RELEASE_DIR%\backend\app\schemas" 2>nul
mkdir "%RELEASE_DIR%\backend\app\services" 2>nul
mkdir "%RELEASE_DIR%\backend\data" 2>nul
mkdir "%RELEASE_DIR%\frontend" 2>nul
mkdir "%RELEASE_DIR%\frontend\js" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\components" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\components\ai" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\components\base" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\components\notes" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\constants" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\core" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\models" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\services" 2>nul
mkdir "%RELEASE_DIR%\frontend\js\utils" 2>nul
mkdir "%RELEASE_DIR%\frontend\assets" 2>nul
mkdir "%RELEASE_DIR%\notes" 2>nul
mkdir "%RELEASE_DIR%\data" 2>nul

REM 构建生产版CSS
echo [INFO] 构建生产版CSS...
call npm run build-css-prod
if errorlevel 1 (
  echo [ERROR] CSS构建失败。
  exit /b 1
)

REM 复制后端文件
echo [INFO] 复制后端文件...
xcopy /E /I /Y "backend\app" "%RELEASE_DIR%\backend\app"
xcopy /E /I /Y "backend\requirements.txt" "%RELEASE_DIR%\backend\"

REM 复制前端文件
echo [INFO] 复制前端文件...
copy /Y "index.html" "%RELEASE_DIR%\"
copy /Y "favicon.ico" "%RELEASE_DIR%\"
copy /Y "favicon.svg" "%RELEASE_DIR%\"
xcopy /E /I /Y "frontend\js" "%RELEASE_DIR%\frontend\js"
xcopy /E /I /Y "frontend\assets" "%RELEASE_DIR%\frontend\assets"
copy /Y "frontend\styles.css" "%RELEASE_DIR%\frontend\"

REM 复制配置文件
echo [INFO] 复制配置文件...
copy /Y "tailwind.config.js" "%RELEASE_DIR%\"
copy /Y "package.json" "%RELEASE_DIR%\"

REM 复制数据库文件（如果存在）
if exist "data\notes.db" (
  echo [INFO] 复制数据库文件...
  copy /Y "data\notes.db" "%RELEASE_DIR%\data\"
)

REM 复制笔记文件（如果存在）
if exist "notes" (
  echo [INFO] 复制笔记文件...
  xcopy /E /I /Y "notes" "%RELEASE_DIR%\notes"
)

REM 创建生产环境启动脚本
echo [INFO] 创建生产环境启动脚本...
(
echo @echo off
echo setlocal ENABLEDELAYEDEXPANSION
echo.
echo REM ==========================================
echo REM 智能笔记管理器 - 生产环境启动脚本
echo REM ==========================================
echo.
echo REM 设置项目根目录
echo set ROOT=%%~dp0
echo cd /d "%%ROOT%%"
echo.
echo REM 检查Python环境
echo where python ^>nul 2^>nul
echo if errorlevel 1 ^(
echo   echo [ERROR] 未找到 Python，请先安装 Python 并加入 PATH。
echo   exit /b 1
echo ^)
echo.
echo REM 创建虚拟环境（如果不存在）
echo if not exist .venv ^(
echo   echo [INFO] 创建虚拟环境 .venv ...
echo   python -m venv .venv
echo ^)
echo.
echo REM 安装依赖
echo echo [INFO] 安装依赖 ...
echo call .venv\Scripts\python -m pip install --upgrade pip ^>nul
echo call .venv\Scripts\python -m pip install -r backend\requirements.txt ^>nul
echo.
echo REM 启动应用
echo echo [INFO] 启动智能笔记管理器...
echo echo [INFO] 访问地址: http://127.0.0.1:8000
echo echo [INFO] 按 Ctrl+C 停止服务
echo call .venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
echo.
echo endlocal
echo pause
) > "%RELEASE_DIR%\start.bat"

REM 创建Linux启动脚本
echo [INFO] 创建Linux启动脚本...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # 智能笔记管理器 - 生产环境启动脚本
echo # ==========================================
echo.
echo # 设置项目根目录
echo ROOT="$(cd "$(dirname "$0")" && pwd)"
echo cd "$ROOT"
echo.
echo # 检查Python环境
echo if ! command -v python3 &> /dev/null; then
echo     echo "[ERROR] 未找到 Python3，请先安装 Python3。"
echo     exit 1
echo fi
echo.
echo # 创建虚拟环境（如果不存在）
echo if [ ! -d ".venv" ]; then
echo     echo "[INFO] 创建虚拟环境 .venv ..."
echo     python3 -m venv .venv
echo fi
echo.
echo # 安装依赖
echo echo "[INFO] 安装依赖 ..."
echo .venv/bin/python -m pip install --upgrade pip > /dev/null
echo .venv/bin/python -m pip install -r backend/requirements.txt > /dev/null
echo.
echo # 启动应用
echo echo "[INFO] 启动智能笔记管理器..."
echo echo "[INFO] 访问地址: http://127.0.0.1:8000"
echo echo "[INFO] 按 Ctrl+C 停止服务"
echo .venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
) > "%RELEASE_DIR%\start.sh"

REM 设置Linux脚本执行权限（如果在Git Bash中运行）
where bash >nul 2>nul
if not errorlevel 1 (
  bash -c "chmod +x '%RELEASE_DIR%\start.sh'"
)

REM 创建README文件
echo [INFO] 创建发布说明...
(
echo # 智能笔记管理器 - 生产版本 v%VERSION%
echo.
echo ## 版本信息
echo - 版本号: v%VERSION%
echo - 构建时间: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo - 构建环境: Windows
echo.
echo ## 快速启动
echo.
echo ### Windows系统
echo 1. 双击运行 `start.bat`
echo 2. 等待依赖安装完成
echo 3. 在浏览器中访问 http://127.0.0.1:8000
echo.
echo ### Linux/macOS系统
echo 1. 给脚本添加执行权限: `chmod +x start.sh`
echo 2. 运行启动脚本: `./start.sh`
echo 3. 在浏览器中访问 http://127.0.0.1:8000
echo.
echo ## 注意事项
echo - 首次运行会自动创建虚拟环境和安装依赖
echo - 数据库文件位于 `data/notes.db`
echo - 笔记文件保存在 `notes/` 目录下
echo - 如需修改端口，请编辑启动脚本中的端口号
echo.
echo ## 功能特性
echo - AI 自动分析笔记内容并提取分类、标签
echo - 一键 AI 优化正文并生成标题
echo - 笔记保存到 SQLite 与本地 Markdown 文件
echo - 支持全文搜索和条件过滤
echo - 全屏编辑模式
echo - 本地运行，无需外网
echo.
echo ## 技术支持
echo 如有问题，请查看项目文档或联系开发者。
) > "%RELEASE_DIR%\README.md"

REM 创建.gitignore文件
echo [INFO] 创建.gitignore文件...
(
echo # Python
echo __pycache__/
echo *.py[cod]
echo *$py.class
echo *.so
echo .Python
echo build/
echo develop-eggs/
echo dist/
echo downloads/
echo eggs/
echo .eggs/
echo lib/
echo lib64/
echo parts/
echo sdist/
echo var/
echo wheels/
echo *.egg-info/
echo .installed.cfg
echo *.egg
echo.
echo # Virtual Environment
echo .venv/
echo venv/
echo ENV/
echo env/
echo.
echo # Database
echo *.db
echo *.sqlite
echo *.sqlite3
echo.
echo # Logs
echo *.log
echo logs/
echo.
echo # IDE
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
echo.
echo # Node.js
echo node_modules/
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
) > "%RELEASE_DIR%\.gitignore"

REM 计算文件大小
echo [INFO] 计算发布包大小...
for /f "tokens=3" %%a in ('dir "%RELEASE_DIR%" /s /-c ^| find "个文件"') do set "SIZE=%%a"
echo [INFO] 发布包大小: %SIZE% 字节

REM 创建压缩包（如果7zip可用）
where 7z >nul 2>nul
if not errorlevel 1 (
  echo [INFO] 创建压缩包...
  set "ZIP_NAME=note-ai-manager-v%VERSION%.zip"
  7z a -tzip "%RELEASE_DIR%\%ZIP_NAME%" "%RELEASE_DIR%\*" -xr!*.zip
  echo [INFO] 压缩包已创建: %RELEASE_DIR%\%ZIP_NAME%
)

REM 完成提示
echo.
echo ==========================================
echo 打包完成！
echo ==========================================
echo 发布目录: %RELEASE_DIR%
echo 版本号: v%VERSION%
echo 构建时间: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo.
echo 启动方式:
echo - Windows: 双击 %RELEASE_DIR%\start.bat
echo - Linux: chmod +x %RELEASE_DIR%\start.sh ^&^& %RELEASE_DIR%\start.sh
echo.
echo 访问地址: http://127.0.0.1:8000
echo ==========================================

endlocal
pause
