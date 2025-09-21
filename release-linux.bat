@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==========================================
REM ���ܱʼǹ����� - Linuxר�ô���ű�
REM ==========================================

REM ������Ŀ��Ŀ¼
set ROOT=%~dp0
cd /d "%ROOT%"

REM ���ð汾�źͷ���ʱ��
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "VERSION=%YYYY%%MM%%DD%_%HH%%Min%"
set "RELEASE_DIR=release\note-ai-manager-linux-v%VERSION%"

echo [INFO] ��ʼ���Linux�汾 v%VERSION%...
echo [INFO] ����Ŀ¼: %RELEASE_DIR%

REM ���Python����
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] δ�ҵ� Python�����Ȱ�װ Python ������ PATH��
  exit /b 1
)

REM ���Node.js����
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] δ�ҵ� Node.js�����Ȱ�װ Node.js ������ PATH��
  exit /b 1
)

REM ����ɵķ���Ŀ¼
if exist "%RELEASE_DIR%" (
  echo [INFO] ����ɵķ���Ŀ¼...
  rmdir /s /q "%RELEASE_DIR%"
)

REM ��������Ŀ¼�ṹ
echo [INFO] ��������Ŀ¼�ṹ...
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

REM ����������CSS
echo [INFO] ����������CSS...
call npm run build-css-prod
if errorlevel 1 (
  echo [ERROR] CSS����ʧ�ܡ�
  exit /b 1
)

REM ���ƺ���ļ�
echo [INFO] ���ƺ���ļ�...
xcopy /E /I /Y "backend\app" "%RELEASE_DIR%\backend\app"
xcopy /E /I /Y "backend\requirements.txt" "%RELEASE_DIR%\backend\"

REM ����ǰ���ļ�
echo [INFO] ����ǰ���ļ�...
copy /Y "index.html" "%RELEASE_DIR%\"
copy /Y "favicon.ico" "%RELEASE_DIR%\"
copy /Y "favicon.svg" "%RELEASE_DIR%\"
xcopy /E /I /Y "frontend\js" "%RELEASE_DIR%\frontend\js"
xcopy /E /I /Y "frontend\assets" "%RELEASE_DIR%\frontend\assets"
copy /Y "frontend\styles.css" "%RELEASE_DIR%\frontend\"

REM ���������ļ�
echo [INFO] ���������ļ�...
copy /Y "tailwind.config.js" "%RELEASE_DIR%\"
copy /Y "package.json" "%RELEASE_DIR%\"

REM �������ݿ��ļ���������ڣ�
if exist "data\notes.db" (
  echo [INFO] �������ݿ��ļ�...
  copy /Y "data\notes.db" "%RELEASE_DIR%\data\"
)

REM ���Ʊʼ��ļ���������ڣ�
if exist "notes" (
  echo [INFO] ���Ʊʼ��ļ�...
  xcopy /E /I /Y "notes" "%RELEASE_DIR%\notes"
)

REM ����Linux�����ű�
echo [INFO] ����Linux�����ű�...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # ���ܱʼǹ����� - Linux�������������ű�
echo # ==========================================
echo.
echo # ������ɫ���
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo YELLOW='\033[1;33m'
echo BLUE='\033[0;34m'
echo NC='\033[0m' # No Color
echo.
echo # ������Ŀ��Ŀ¼
echo ROOT="$(cd "$(dirname "$0")" && pwd)"
echo cd "$ROOT"
echo.
echo echo -e "${BLUE}[INFO] ���ܱʼǹ����� - Linux�汾${NC}"
echo echo -e "${BLUE}[INFO] ��ĿĿ¼: $ROOT${NC}"
echo.
echo # ���Python����
echo if ! command -v python3 &> /dev/null; then
echo     echo -e "${RED}[ERROR] δ�ҵ� Python3�����Ȱ�װ Python3��${NC}"
echo     echo -e "${YELLOW}[INFO] ��װ����: sudo apt install python3 python3-pip (Ubuntu/Debian)${NC}"
echo     echo -e "${YELLOW}[INFO] ��װ����: sudo yum install python3 python3-pip (CentOS/RHEL)${NC}"
echo     exit 1
echo fi
echo.
echo # ���Python�汾
echo PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo echo -e "${GREEN}[INFO] Python�汾: $PYTHON_VERSION${NC}"
echo.
echo # ���pip
echo if ! command -v pip3 &> /dev/null; then
echo     echo -e "${YELLOW}[WARN] δ�ҵ� pip3������ʹ�� python3 -m pip${NC}"
echo     PIP_CMD="python3 -m pip"
echo else
echo     PIP_CMD="pip3"
echo fi
echo.
echo # �������⻷������������ڣ�
echo if [ ! -d ".venv" ]; then
echo     echo -e "${BLUE}[INFO] �������⻷�� .venv ...${NC}"
echo     python3 -m venv .venv
echo     if [ $? -ne 0 ]; then
echo         echo -e "${RED}[ERROR] ���⻷������ʧ��${NC}"
echo         exit 1
echo     fi
echo fi
echo.
echo # �������⻷��
echo echo -e "${BLUE}[INFO] �������⻷��...${NC}"
echo source .venv/bin/activate
echo.
echo # ����pip
echo echo -e "${BLUE}[INFO] ����pip...${NC}"
echo python -m pip install --upgrade pip > /dev/null 2>&1
echo.
echo # ��װ����
echo echo -e "${BLUE}[INFO] ��װ������...${NC}"
echo python -m pip install -r backend/requirements.txt
echo if [ $? -ne 0 ]; then
echo     echo -e "${RED}[ERROR] ������װʧ��${NC}"
echo     echo -e "${YELLOW}[INFO] �����������ӻ���ʹ�ù��ھ���Դ${NC}"
echo     echo -e "${YELLOW}[INFO] ����: pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend/requirements.txt${NC}"
echo     exit 1
echo fi
echo.
echo # ���˿��Ƿ�ռ��
echo PORT=8000
echo if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
echo     echo -e "${YELLOW}[WARN] �˿� $PORT �ѱ�ռ�ã�����ʹ�ö˿� 8001${NC}"
echo     PORT=8001
echo fi
echo.
echo # ����Ӧ��
echo echo -e "${GREEN}[INFO] �������ܱʼǹ�����...${NC}"
echo echo -e "${GREEN}[INFO] ���ʵ�ַ: http://127.0.0.1:$PORT${NC}"
echo echo -e "${GREEN}[INFO] �� Ctrl+C ֹͣ����${NC}"
echo echo.
echo # ��������
echo python -m uvicorn backend.app.main:app --host 127.0.0.1 --port $PORT
echo.
echo # ��������쳣�˳�����ʾ������Ϣ
echo if [ $? -ne 0 ]; then
echo     echo -e "${RED}[ERROR] ��������ʧ��${NC}"
echo     echo -e "${YELLOW}[INFO] ���������Ϣ����ϵ������${NC}"
echo     read -p "���س����˳�..."
echo fi
) > "%RELEASE_DIR%\start.sh"

REM ����Linux��װ�ű�
echo [INFO] ����Linux��װ�ű�...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # ���ܱʼǹ����� - Linux�Զ���װ�ű�
echo # ==========================================
echo.
echo # ������ɫ���
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo YELLOW='\033[1;33m'
echo BLUE='\033[0;34m'
echo NC='\033[0m' # No Color
echo.
echo echo -e "${BLUE}���ܱʼǹ����� - Linux�Զ���װ�ű�${NC}"
echo echo -e "${BLUE}==========================================${NC}"
echo.
echo # ���ϵͳ����
echo if [ -f /etc/os-release ]; then
echo     . /etc/os-release
echo     OS=$NAME
echo else
echo     OS=$(uname -s)
echo fi
echo.
echo echo -e "${GREEN}[INFO] ��⵽ϵͳ: $OS${NC}"
echo.
echo # ��װPython3��pip
echo echo -e "${BLUE}[INFO] ��鲢��װPython3��pip...${NC}"
echo.
echo if command -v python3 &> /dev/null; then
echo     echo -e "${GREEN}[INFO] Python3 �Ѱ�װ${NC}"
echo else
echo     echo -e "${YELLOW}[INFO] ��װPython3...${NC}"
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
echo         echo -e "${RED}[ERROR] ��֧�ֵ�ϵͳ����: $OS${NC}"
echo         echo -e "${YELLOW}[INFO] ���ֶ���װPython3��pip${NC}"
echo         exit 1
echo     fi
echo fi
echo.
echo # ��װNode.js (�����Ҫ)
echo if command -v node &> /dev/null; then
echo     echo -e "${GREEN}[INFO] Node.js �Ѱ�װ${NC}"
echo else
echo     echo -e "${YELLOW}[INFO] ��װNode.js...${NC}"
echo     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
echo     sudo apt-get install -y nodejs
echo fi
echo.
echo # ����ִ��Ȩ��
echo echo -e "${BLUE}[INFO] ����ִ��Ȩ��...${NC}"
echo chmod +x start.sh
echo.
echo echo -e "${GREEN}[INFO] ��װ��ɣ�${NC}"
echo echo -e "${GREEN}[INFO] ���� ./start.sh ����Ӧ��${NC}"
echo echo -e "${GREEN}[INFO] ���ʵ�ַ: http://127.0.0.1:8000${NC}"
) > "%RELEASE_DIR%\install.sh"

REM ����Linux�ű�ִ��Ȩ�ޣ������Git Bash�����У�
where bash >nul 2>nul
if not errorlevel 1 (
  echo [INFO] ����Linux�ű�ִ��Ȩ��...
  bash -c "chmod +x '%RELEASE_DIR%\start.sh'"
  bash -c "chmod +x '%RELEASE_DIR%\install.sh'"
)

REM ����Linuxר��README�ļ�
echo [INFO] ����Linux����˵��...
(
echo # ���ܱʼǹ����� - Linux�汾 v%VERSION%
echo.
echo ## �汾��Ϣ
echo - �汾��: v%VERSION%
echo - ����ʱ��: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo - ��������: Windows (��ƽ̨���)
echo - Ŀ��ƽ̨: Linux (Ubuntu/CentOS/Debian/Fedora/Arch)
echo.
echo ## ϵͳҪ��
echo - Python 3.8+ (�Ƽ� 3.10+)
echo - pip3
echo - �������� (����AI����)
echo.
echo ## ���ٰ�װ
echo.
echo ### ����һ���Զ���װ (�Ƽ�)
echo ```bash
echo # 1. ��ѹ�ļ�
echo unzip note-ai-manager-linux-v%VERSION%.zip
echo cd note-ai-manager-linux-v%VERSION%
echo.
echo # 2. �����Զ���װ�ű�
echo chmod +x install.sh
echo ./install.sh
echo.
echo # 3. ����Ӧ��
echo ./start.sh
echo ```
echo.
echo ### ���������ֶ���װ
echo ```bash
echo # 1. ��װPython3��pip
echo # Ubuntu/Debian:
echo sudo apt update
echo sudo apt install python3 python3-pip python3-venv
echo.
echo # CentOS/RHEL:
echo sudo yum install python3 python3-pip
echo.
echo # 2. ��ѹ������Ŀ¼
echo unzip note-ai-manager-linux-v%VERSION%.zip
echo cd note-ai-manager-linux-v%VERSION%
echo.
echo # 3. ����ִ��Ȩ��
echo chmod +x start.sh
echo.
echo # 4. ����Ӧ��
echo ./start.sh
echo ```
echo.
echo ## ʹ��˵��
echo.
echo ### ����Ӧ��
echo ```bash
echo ./start.sh
echo ```
echo.
echo ### ����Ӧ��
echo - ���ط���: http://127.0.0.1:8000
echo - ����������: http://[���IP]:8000
echo.
echo ### ֹͣӦ��
echo �� `Ctrl+C` ֹͣ����
echo.
echo ### ��̨����
echo ```bash
echo # ʹ��nohup��̨����
echo nohup ./start.sh > app.log 2>&1 &
echo.
echo # �鿴��־
echo tail -f app.log
echo.
echo # ֹͣ��̨����
echo pkill -f "uvicorn backend.app.main:app"
echo ```
echo.
echo ## ����˵��
echo.
echo ### API����
echo �״�������������������ã�
echo - API��ַ (Base URL)
echo - API��Կ (API Key)  
echo - ģ������
echo.
echo ### ���ݴ洢
echo - ���ݿ�: `data/notes.db`
echo - �ʼ��ļ�: `notes/` Ŀ¼
echo - �����ļ�: �Զ�����
echo.
echo ## �����ų�
echo.
echo ### ��������
echo.
echo **1. Python3δ��װ**
echo ```bash
echo # Ubuntu/Debian
echo sudo apt install python3 python3-pip python3-venv
echo.
echo # CentOS/RHEL
echo sudo yum install python3 python3-pip
echo ```
echo.
echo **2. ������װʧ��**
echo ```bash
echo # ʹ�ù��ھ���Դ
echo pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend/requirements.txt
echo ```
echo.
echo **3. �˿ڱ�ռ��**
echo ```bash
echo # �鿴�˿�ռ��
echo lsof -i :8000
echo.
echo # ɱ��ռ�ý���
echo sudo kill -9 [PID]
echo ```
echo.
echo **4. Ȩ������**
echo ```bash
echo # ����ִ��Ȩ��
echo chmod +x start.sh
echo chmod +x install.sh
echo.
echo # �����ļ�Ȩ��
echo chmod -R 755 .
echo ```
echo.
echo ### ��־�鿴
echo ```bash
echo # �鿴������־
echo ./start.sh
echo.
echo # ��̨������־
echo tail -f app.log
echo ```
echo.
echo ## ��������
echo - AI �Զ������ʼ����ݲ���ȡ���ࡢ��ǩ
echo - һ�� AI �Ż����Ĳ����ɱ���
echo - �ʼǱ��浽 SQLite �뱾�� Markdown �ļ�
echo - ֧��ȫ����������������
echo - ȫ���༭ģʽ
echo - �������У��������� (AI������Ҫ����)
echo.
echo ## ����֧��
echo �������⣬�룺
echo 1. �鿴���ĵ��Ĺ����ų�����
echo 2. ������̨������Ϣ
echo 3. ��ϵ�����߻�ȡ֧��
echo.
echo ## ������־
echo - v%VERSION%: Linuxר�ð汾����
echo - ֧���Զ���װ����������
echo - �Ż��������ű��ʹ�����
echo - ������Linuxϵͳ������
) > "%RELEASE_DIR%\README.md"

REM ����.gitignore�ļ�
echo [INFO] ����.gitignore�ļ�...
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

REM �����ļ���С
echo [INFO] ���㷢������С...
for /f "tokens=3" %%a in ('dir "%RELEASE_DIR%" /s /-c ^| find "���ļ�"') do set "SIZE=%%a"
echo [INFO] ��������С: %SIZE% �ֽ�

REM ����ѹ���������7zip���ã�
where 7z >nul 2>nul
if not errorlevel 1 (
  echo [INFO] ����ѹ����...
  set "ZIP_NAME=note-ai-manager-linux-v%VERSION%.zip"
  7z a -tzip "%RELEASE_DIR%\%ZIP_NAME%" "%RELEASE_DIR%\*" -xr!*.zip
  echo [INFO] ѹ�����Ѵ���: %RELEASE_DIR%\%ZIP_NAME%
)

REM �����ʾ
echo.
echo ==========================================
echo Linux�汾�����ɣ�
echo ==========================================
echo ����Ŀ¼: %RELEASE_DIR%
echo �汾��: v%VERSION%
echo ����ʱ��: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo.
echo Linux�û�ʹ�ò���:
echo 1. ��ѹ�ļ���Ŀ��Ŀ¼
echo 2. ����: chmod +x install.sh && ./install.sh
echo 3. ����: ./start.sh
echo 4. ����: http://127.0.0.1:8000
echo.
echo �ļ�˵��:
echo - start.sh: �������ű�
echo - install.sh: �Զ���װ�ű�
echo - README.md: ��ϸʹ��˵��
echo ==========================================

endlocal
pause
