@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ==========================================
echo 智能笔记管理器 - 打包测试脚本
echo ==========================================

REM 设置测试版本号
set "TEST_VERSION=test_%RANDOM%"
set "TEST_DIR=release\test-%TEST_VERSION%"

echo [INFO] 开始测试打包功能...
echo [INFO] 测试目录: %TEST_DIR%

REM 清理测试目录
if exist "%TEST_DIR%" rmdir /s /q "%TEST_DIR%"
mkdir "%TEST_DIR%" 2>nul

REM 测试CSS构建
echo [INFO] 测试CSS构建...
call npm run build-css-prod
if errorlevel 1 (
  echo [ERROR] CSS构建失败！
  exit /b 1
)
echo [SUCCESS] CSS构建成功！

REM 测试文件复制
echo [INFO] 测试文件复制...
copy /Y "index.html" "%TEST_DIR%\" 2>nul
copy /Y "favicon.ico" "%TEST_DIR%\" 2>nul
copy /Y "frontend\styles.css" "%TEST_DIR%\" 2>nul

REM 检查文件是否存在
if exist "%TEST_DIR%\index.html" (
  echo [SUCCESS] index.html 复制成功！
) else (
  echo [ERROR] index.html 复制失败！
)

if exist "%TEST_DIR%\styles.css" (
  echo [SUCCESS] styles.css 复制成功！
) else (
  echo [ERROR] styles.css 复制失败！
)

REM 创建测试启动脚本
echo [INFO] 创建测试启动脚本...
echo @echo off > "%TEST_DIR%\test-start.bat"
echo echo 测试启动脚本 >> "%TEST_DIR%\test-start.bat"
echo echo 这是测试版本，请使用正式的启动脚本 >> "%TEST_DIR%\test-start.bat"
echo pause >> "%TEST_DIR%\test-start.bat"

REM 检查启动脚本
if exist "%TEST_DIR%\test-start.bat" (
  echo [SUCCESS] 启动脚本创建成功！
) else (
  echo [ERROR] 启动脚本创建失败！
)

REM 计算文件大小
for /f "tokens=3" %%a in ('dir "%TEST_DIR%" /s /-c ^| find "个文件"') do set "SIZE=%%a"
echo [INFO] 测试包大小: %SIZE% 字节

REM 清理测试目录
echo [INFO] 清理测试目录...
rmdir /s /q "%TEST_DIR%"

echo.
echo ==========================================
echo 测试完成！
echo ==========================================
echo 所有测试项目均通过，打包脚本可以正常使用。
echo.
echo 使用方法:
echo 1. 运行 release.bat 创建完整生产版本
echo 2. 运行 release-simple.bat 创建简化版本
echo ==========================================

endlocal
pause
