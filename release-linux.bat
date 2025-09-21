@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==========================================
REM 智能笔记管理器 - Linux专用打包脚本
REM ==========================================

REM 设置项目根目录
set ROOT=%~dp0
cd /d "%ROOT%"

REM 设置版本号和发布时间
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "VERSION=%YYYY%%MM%%DD%_%HH%%Min%"
set "RELEASE_DIR=release\note-ai-manager-linux-v%VERSION%"

echo [INFO] 开始打包Linux版本 v%VERSION%...
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

REM 创建Linux启动脚本
echo [INFO] 创建Linux启动脚本...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # 智能笔记管理器 - Linux生产环境启动脚本
echo # ==========================================
echo.
echo # 设置颜色输出
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo YELLOW='\033[1;33m'
echo BLUE='\033[0;34m'
echo NC='\033[0m' # No Color
echo.
echo # 设置项目根目录
echo ROOT="$(cd "$(dirname "$0")" && pwd)"
echo cd "$ROOT"
echo.
echo echo -e "${BLUE}[INFO] 智能笔记管理器 - Linux版本${NC}"
echo echo -e "${BLUE}[INFO] 项目目录: $ROOT${NC}"
echo.
echo # 检查Python环境
echo if ! command -v python3 &> /dev/null; then
echo     echo -e "${RED}[ERROR] 未找到 Python3，请先安装 Python3。${NC}"
echo     echo -e "${YELLOW}[INFO] 安装命令: sudo apt install python3 python3-pip (Ubuntu/Debian)${NC}"
echo     echo -e "${YELLOW}[INFO] 安装命令: sudo yum install python3 python3-pip (CentOS/RHEL)${NC}"
echo     exit 1
echo fi
echo.
echo # 检查Python版本
echo PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo echo -e "${GREEN}[INFO] Python版本: $PYTHON_VERSION${NC}"
echo.
echo # 检查pip
echo if ! command -v pip3 &> /dev/null; then
echo     echo -e "${YELLOW}[WARN] 未找到 pip3，尝试使用 python3 -m pip${NC}"
echo     PIP_CMD="python3 -m pip"
echo else
echo     PIP_CMD="pip3"
echo fi
echo.
echo # 创建虚拟环境（如果不存在）
echo if [ ! -d ".venv" ]; then
echo     echo -e "${BLUE}[INFO] 创建虚拟环境 .venv ...${NC}"
echo     python3 -m venv .venv
echo     if [ $? -ne 0 ]; then
echo         echo -e "${RED}[ERROR] 虚拟环境创建失败${NC}"
echo         exit 1
echo     fi
echo fi
echo.
echo # 激活虚拟环境
echo echo -e "${BLUE}[INFO] 激活虚拟环境...${NC}"
echo source .venv/bin/activate
echo.
echo # 升级pip
echo echo -e "${BLUE}[INFO] 升级pip...${NC}"
echo python -m pip install --upgrade pip > /dev/null 2>&1
echo.
echo # 安装依赖
echo echo -e "${BLUE}[INFO] 安装依赖包...${NC}"
echo python -m pip install -r backend/requirements.txt
echo if [ $? -ne 0 ]; then
echo     echo -e "${RED}[ERROR] 依赖安装失败${NC}"
echo     echo -e "${YELLOW}[INFO] 请检查网络连接或尝试使用国内镜像源${NC}"
echo     echo -e "${YELLOW}[INFO] 例如: pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend/requirements.txt${NC}"
echo     exit 1
echo fi
echo.
echo # 检查端口是否被占用
echo PORT=8000
echo if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
echo     echo -e "${YELLOW}[WARN] 端口 $PORT 已被占用，尝试使用端口 8001${NC}"
echo     PORT=8001
echo fi
echo.
echo # 启动应用
echo echo -e "${GREEN}[INFO] 启动智能笔记管理器...${NC}"
echo echo -e "${GREEN}[INFO] 访问地址: http://127.0.0.1:$PORT${NC}"
echo echo -e "${GREEN}[INFO] 按 Ctrl+C 停止服务${NC}"
echo echo.
echo # 启动服务
echo python -m uvicorn backend.app.main:app --host 127.0.0.1 --port $PORT
echo.
echo # 如果服务异常退出，显示错误信息
echo if [ $? -ne 0 ]; then
echo     echo -e "${RED}[ERROR] 服务启动失败${NC}"
echo     echo -e "${YELLOW}[INFO] 请检查错误信息或联系开发者${NC}"
echo     read -p "按回车键退出..."
echo fi
) > "%RELEASE_DIR%\start.sh"

REM 创建Linux安装脚本
echo [INFO] 创建Linux安装脚本...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # 智能笔记管理器 - Linux自动安装脚本
echo # ==========================================
echo.
echo # 设置颜色输出
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo YELLOW='\033[1;33m'
echo BLUE='\033[0;34m'
echo NC='\033[0m' # No Color
echo.
echo echo -e "${BLUE}智能笔记管理器 - Linux自动安装脚本${NC}"
echo echo -e "${BLUE}==========================================${NC}"
echo.
echo # 检测系统类型
echo if [ -f /etc/os-release ]; then
echo     . /etc/os-release
echo     OS=$NAME
echo else
echo     OS=$(uname -s)
echo fi
echo.
echo echo -e "${GREEN}[INFO] 检测到系统: $OS${NC}"
echo.
echo # 安装Python3和pip
echo echo -e "${BLUE}[INFO] 检查并安装Python3和pip...${NC}"
echo.
echo if command -v python3 &> /dev/null; then
echo     echo -e "${GREEN}[INFO] Python3 已安装${NC}"
echo else
echo     echo -e "${YELLOW}[INFO] 安装Python3...${NC}"
echo     if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
echo         sudo apt update
echo         sudo apt install -y python3 python3-pip python3-venv
echo     elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
echo         sudo yum install -y python3 python3-pip
echo     elif [[ "$OS" == *"Fedora"* ]]; then
echo         sudo dnf install -y python3 python3-pip
echo     elif [[ "$OS" == *"Arch"* ]]; then
echo         sudo pacman -S python python-pip
echo     else
echo         echo -e "${RED}[ERROR] 不支持的系统类型: $OS${NC}"
echo         echo -e "${YELLOW}[INFO] 请手动安装Python3和pip${NC}"
echo         exit 1
echo     fi
echo fi
echo.
echo # 安装Node.js (如果需要)
echo if command -v node &> /dev/null; then
echo     echo -e "${GREEN}[INFO] Node.js 已安装${NC}"
echo else
echo     echo -e "${YELLOW}[INFO] 安装Node.js...${NC}"
echo     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
echo     sudo apt-get install -y nodejs
echo fi
echo.
echo # 设置执行权限
echo echo -e "${BLUE}[INFO] 设置执行权限...${NC}"
echo chmod +x start.sh
echo.
echo echo -e "${GREEN}[INFO] 安装完成！${NC}"
echo echo -e "${GREEN}[INFO] 运行 ./start.sh 启动应用${NC}"
echo echo -e "${GREEN}[INFO] 访问地址: http://127.0.0.1:8000${NC}"
) > "%RELEASE_DIR%\install.sh"

REM 设置Linux脚本执行权限（如果在Git Bash中运行）
where bash >nul 2>nul
if not errorlevel 1 (
  echo [INFO] 设置Linux脚本执行权限...
  bash -c "chmod +x '%RELEASE_DIR%\start.sh'"
  bash -c "chmod +x '%RELEASE_DIR%\install.sh'"
)

REM 创建Linux专用README文件
echo [INFO] 创建Linux发布说明...
(
echo # 智能笔记管理器 - Linux版本 v%VERSION%
echo.
echo ## 版本信息
echo - 版本号: v%VERSION%
echo - 构建时间: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo - 构建环境: Windows (跨平台打包)
echo - 目标平台: Linux (Ubuntu/CentOS/Debian/Fedora/Arch)
echo.
echo ## 系统要求
echo - Python 3.8+ (推荐 3.10+)
echo - pip3
echo - 网络连接 (用于AI功能)
echo.
echo ## 快速安装
echo.
echo ### 方法一：自动安装 (推荐)
echo ```bash
echo # 1. 解压文件
echo unzip note-ai-manager-linux-v%VERSION%.zip
echo cd note-ai-manager-linux-v%VERSION%
echo.
echo # 2. 运行自动安装脚本
echo chmod +x install.sh
echo ./install.sh
echo.
echo # 3. 启动应用
echo ./start.sh
echo ```
echo.
echo ### 方法二：手动安装
echo ```bash
echo # 1. 安装Python3和pip
echo # Ubuntu/Debian:
echo sudo apt update
echo sudo apt install python3 python3-pip python3-venv
echo.
echo # CentOS/RHEL:
echo sudo yum install python3 python3-pip
echo.
echo # 2. 解压并进入目录
echo unzip note-ai-manager-linux-v%VERSION%.zip
echo cd note-ai-manager-linux-v%VERSION%
echo.
echo # 3. 设置执行权限
echo chmod +x start.sh
echo.
echo # 4. 启动应用
echo ./start.sh
echo ```
echo.
echo ## 使用说明
echo.
echo ### 启动应用
echo ```bash
echo ./start.sh
echo ```
echo.
echo ### 访问应用
echo - 本地访问: http://127.0.0.1:8000
echo - 局域网访问: http://[你的IP]:8000
echo.
echo ### 停止应用
echo 按 `Ctrl+C` 停止服务
echo.
echo ### 后台运行
echo ```bash
echo # 使用nohup后台运行
echo nohup ./start.sh > app.log 2>&1 &
echo.
echo # 查看日志
echo tail -f app.log
echo.
echo # 停止后台服务
echo pkill -f "uvicorn backend.app.main:app"
echo ```
echo.
echo ## 配置说明
echo.
echo ### API配置
echo 首次启动后，在浏览器中配置：
echo - API地址 (Base URL)
echo - API密钥 (API Key)  
echo - 模型名称
echo.
echo ### 数据存储
echo - 数据库: `data/notes.db`
echo - 笔记文件: `notes/` 目录
echo - 配置文件: 自动生成
echo.
echo ## 故障排除
echo.
echo ### 常见问题
echo.
echo **1. Python3未安装**
echo ```bash
echo # Ubuntu/Debian
echo sudo apt install python3 python3-pip python3-venv
echo.
echo # CentOS/RHEL
echo sudo yum install python3 python3-pip
echo ```
echo.
echo **2. 依赖安装失败**
echo ```bash
echo # 使用国内镜像源
echo pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend/requirements.txt
echo ```
echo.
echo **3. 端口被占用**
echo ```bash
echo # 查看端口占用
echo lsof -i :8000
echo.
echo # 杀死占用进程
echo sudo kill -9 [PID]
echo ```
echo.
echo **4. 权限问题**
echo ```bash
echo # 设置执行权限
echo chmod +x start.sh
echo chmod +x install.sh
echo.
echo # 设置文件权限
echo chmod -R 755 .
echo ```
echo.
echo ### 日志查看
echo ```bash
echo # 查看启动日志
echo ./start.sh
echo.
echo # 后台运行日志
echo tail -f app.log
echo ```
echo.
echo ## 功能特性
echo - AI 自动分析笔记内容并提取分类、标签
echo - 一键 AI 优化正文并生成标题
echo - 笔记保存到 SQLite 与本地 Markdown 文件
echo - 支持全文搜索和条件过滤
echo - 全屏编辑模式
echo - 本地运行，无需外网 (AI功能需要网络)
echo.
echo ## 技术支持
echo 如有问题，请：
echo 1. 查看本文档的故障排除部分
echo 2. 检查控制台错误信息
echo 3. 联系开发者获取支持
echo.
echo ## 更新日志
echo - v%VERSION%: Linux专用版本发布
echo - 支持自动安装和依赖管理
echo - 优化的启动脚本和错误处理
echo - 完整的Linux系统兼容性
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
echo app.log
echo.
echo # IDE
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # Node.js
echo node_modules/
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
) > "%RELEASE_DIR%\.gitignore"

REM 计算文件大小
echo [INFO] 计算发布包大小...
for /f "tokens=3" %%a in ('dir "%RELEASE_DIR%" /s /-c ^| find "个文件"') do set "SIZE=%%a"
echo [INFO] 发布包大小: %SIZE% 字节

REM 创建压缩包（如果7zip可用）
where 7z >nul 2>nul
if not errorlevel 1 (
  echo [INFO] 创建压缩包...
  set "ZIP_NAME=note-ai-manager-linux-v%VERSION%.zip"
  7z a -tzip "%RELEASE_DIR%\%ZIP_NAME%" "%RELEASE_DIR%\*" -xr!*.zip
  echo [INFO] 压缩包已创建: %RELEASE_DIR%\%ZIP_NAME%
)

REM 完成提示
echo.
echo ==========================================
echo Linux版本打包完成！
echo ==========================================
echo 发布目录: %RELEASE_DIR%
echo 版本号: v%VERSION%
echo 构建时间: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo.
echo Linux用户使用步骤:
echo 1. 解压文件到目标目录
echo 2. 运行: chmod +x install.sh && ./install.sh
echo 3. 启动: ./start.sh
echo 4. 访问: http://127.0.0.1:8000
echo.
echo 文件说明:
echo - start.sh: 主启动脚本
echo - install.sh: 自动安装脚本
echo - README.md: 详细使用说明
echo ==========================================

endlocal
pause
