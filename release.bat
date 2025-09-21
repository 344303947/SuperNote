@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==========================================
REM ���ܱʼǹ����� - �����汾����ű�
REM ==========================================

REM ������Ŀ��Ŀ¼
set ROOT=%~dp0
cd /d "%ROOT%"

REM ���ð汾�źͷ���ʱ��
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "VERSION=%YYYY%%MM%%DD%_%HH%%Min%"
set "RELEASE_DIR=release\note-ai-manager-v%VERSION%"

echo [INFO] ��ʼ��������汾 v%VERSION%...
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

REM �����������������ű�
echo [INFO] �����������������ű�...
(
echo @echo off
echo setlocal ENABLEDELAYEDEXPANSION
echo.
echo REM ==========================================
echo REM ���ܱʼǹ����� - �������������ű�
echo REM ==========================================
echo.
echo REM ������Ŀ��Ŀ¼
echo set ROOT=%%~dp0
echo cd /d "%%ROOT%%"
echo.
echo REM ���Python����
echo where python ^>nul 2^>nul
echo if errorlevel 1 ^(
echo   echo [ERROR] δ�ҵ� Python�����Ȱ�װ Python ������ PATH��
echo   exit /b 1
echo ^)
echo.
echo REM �������⻷������������ڣ�
echo if not exist .venv ^(
echo   echo [INFO] �������⻷�� .venv ...
echo   python -m venv .venv
echo ^)
echo.
echo REM ��װ����
echo echo [INFO] ��װ���� ...
echo call .venv\Scripts\python -m pip install --upgrade pip ^>nul
echo call .venv\Scripts\python -m pip install -r backend\requirements.txt ^>nul
echo.
echo REM ����Ӧ��
echo echo [INFO] �������ܱʼǹ�����...
echo echo [INFO] ���ʵ�ַ: http://127.0.0.1:8000
echo echo [INFO] �� Ctrl+C ֹͣ����
echo call .venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
echo.
echo endlocal
echo pause
) > "%RELEASE_DIR%\start.bat"

REM ����Linux�����ű�
echo [INFO] ����Linux�����ű�...
(
echo #!/bin/bash
echo.
echo # ==========================================
echo # ���ܱʼǹ����� - �������������ű�
echo # ==========================================
echo.
echo # ������Ŀ��Ŀ¼
echo ROOT="$(cd "$(dirname "$0")" && pwd)"
echo cd "$ROOT"
echo.
echo # ���Python����
echo if ! command -v python3 &> /dev/null; then
echo     echo "[ERROR] δ�ҵ� Python3�����Ȱ�װ Python3��"
echo     exit 1
echo fi
echo.
echo # �������⻷������������ڣ�
echo if [ ! -d ".venv" ]; then
echo     echo "[INFO] �������⻷�� .venv ..."
echo     python3 -m venv .venv
echo fi
echo.
echo # ��װ����
echo echo "[INFO] ��װ���� ..."
echo .venv/bin/python -m pip install --upgrade pip > /dev/null
echo .venv/bin/python -m pip install -r backend/requirements.txt > /dev/null
echo.
echo # ����Ӧ��
echo echo "[INFO] �������ܱʼǹ�����..."
echo echo "[INFO] ���ʵ�ַ: http://127.0.0.1:8000"
echo echo "[INFO] �� Ctrl+C ֹͣ����"
echo .venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
) > "%RELEASE_DIR%\start.sh"

REM ����Linux�ű�ִ��Ȩ�ޣ������Git Bash�����У�
where bash >nul 2>nul
if not errorlevel 1 (
  bash -c "chmod +x '%RELEASE_DIR%\start.sh'"
)

REM ����README�ļ�
echo [INFO] ��������˵��...
(
echo # ���ܱʼǹ����� - �����汾 v%VERSION%
echo.
echo ## �汾��Ϣ
echo - �汾��: v%VERSION%
echo - ����ʱ��: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo - ��������: Windows
echo.
echo ## ��������
echo.
echo ### Windowsϵͳ
echo 1. ˫������ `start.bat`
echo 2. �ȴ�������װ���
echo 3. ��������з��� http://127.0.0.1:8000
echo.
echo ### Linux/macOSϵͳ
echo 1. ���ű����ִ��Ȩ��: `chmod +x start.sh`
echo 2. ���������ű�: `./start.sh`
echo 3. ��������з��� http://127.0.0.1:8000
echo.
echo ## ע������
echo - �״����л��Զ��������⻷���Ͱ�װ����
echo - ���ݿ��ļ�λ�� `data/notes.db`
echo - �ʼ��ļ������� `notes/` Ŀ¼��
echo - �����޸Ķ˿ڣ���༭�����ű��еĶ˿ں�
echo.
echo ## ��������
echo - AI �Զ������ʼ����ݲ���ȡ���ࡢ��ǩ
echo - һ�� AI �Ż����Ĳ����ɱ���
echo - �ʼǱ��浽 SQLite �뱾�� Markdown �ļ�
echo - ֧��ȫ����������������
echo - ȫ���༭ģʽ
echo - �������У���������
echo.
echo ## ����֧��
echo �������⣬��鿴��Ŀ�ĵ�����ϵ�����ߡ�
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

REM �����ļ���С
echo [INFO] ���㷢������С...
for /f "tokens=3" %%a in ('dir "%RELEASE_DIR%" /s /-c ^| find "���ļ�"') do set "SIZE=%%a"
echo [INFO] ��������С: %SIZE% �ֽ�

REM ����ѹ���������7zip���ã�
where 7z >nul 2>nul
if not errorlevel 1 (
  echo [INFO] ����ѹ����...
  set "ZIP_NAME=note-ai-manager-v%VERSION%.zip"
  7z a -tzip "%RELEASE_DIR%\%ZIP_NAME%" "%RELEASE_DIR%\*" -xr!*.zip
  echo [INFO] ѹ�����Ѵ���: %RELEASE_DIR%\%ZIP_NAME%
)

REM �����ʾ
echo.
echo ==========================================
echo �����ɣ�
echo ==========================================
echo ����Ŀ¼: %RELEASE_DIR%
echo �汾��: v%VERSION%
echo ����ʱ��: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
echo.
echo ������ʽ:
echo - Windows: ˫�� %RELEASE_DIR%\start.bat
echo - Linux: chmod +x %RELEASE_DIR%\start.sh ^&^& %RELEASE_DIR%\start.sh
echo.
echo ���ʵ�ַ: http://127.0.0.1:8000
echo ==========================================

endlocal
pause
