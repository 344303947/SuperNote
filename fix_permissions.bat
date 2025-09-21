@echo off
chcp 65001 >nul
echo 🔧 开始修复智能笔记管理器权限问题...

REM 检查当前目录
if not exist "data\notes.db" (
    echo [ERROR] 未找到数据库文件，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [INFO] 检查当前权限状态...

REM 显示当前权限
echo 当前目录权限:
dir data /q
echo.

REM 修复目录权限
echo [INFO] 修复目录权限...
if not exist "data" mkdir data
if not exist "notes" mkdir notes

REM 设置目录权限为完全控制
icacls data /grant Everyone:F /T >nul 2>&1
icacls notes /grant Everyone:F /T >nul 2>&1

REM 设置数据库文件权限
echo [INFO] 修复数据库文件权限...
icacls data\notes.db /grant Everyone:F >nul 2>&1

REM 检查修复结果
echo [INFO] 验证权限修复结果...
echo 修复后的权限:
dir data /q

REM 测试数据库写入权限
echo [INFO] 测试数据库写入权限...
python -c "
import sqlite3
import os
try:
    # 检查文件权限
    if os.access('data/notes.db', os.W_OK):
        print('✅ 数据库文件可写')
    else:
        print('❌ 数据库文件不可写')
    
    # 测试数据库连接和写入
    conn = sqlite3.connect('data/notes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT 1')
    conn.close()
    print('✅ 数据库连接正常')
    
    # 测试目录写入权限
    if os.access('data', os.W_OK):
        print('✅ data目录可写')
    else:
        print('❌ data目录不可写')
        
    if os.access('notes', os.W_OK):
        print('✅ notes目录可写')
    else:
        print('❌ notes目录不可写')
        
except Exception as e:
    print(f'❌ 权限测试失败: {e}')
"

echo.
echo [SUCCESS] 权限修复完成！
echo [INFO] 现在可以重新启动应用:
echo   run.bat
echo.
echo [INFO] 如果问题仍然存在，请尝试以下解决方案:
echo 1. 以管理员身份运行此脚本
echo 2. 检查磁盘空间: dir C:\
echo 3. 检查防病毒软件是否阻止了文件访问
echo 4. 确保Python进程有足够的权限

pause
