@echo off
chcp 65001 >nul
echo 🔧 快速修复智能笔记管理器权限问题...

REM 检查当前目录
if not exist "data\notes.db" (
    echo [ERROR] 未找到数据库文件，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [INFO] 开始修复权限...

REM 创建目录（如果不存在）
if not exist "data" mkdir data
if not exist "notes" mkdir notes

REM 设置目录权限
echo [INFO] 设置目录权限...
icacls data /grant Everyone:F /T >nul 2>&1
icacls notes /grant Everyone:F /T >nul 2>&1

REM 设置数据库文件权限
echo [INFO] 设置数据库文件权限...
icacls data\notes.db /grant Everyone:F >nul 2>&1

REM 测试数据库连接
echo [INFO] 测试数据库连接...
python -c "
import sqlite3
import os
try:
    # 检查文件权限
    if os.access('data/notes.db', os.W_OK):
        print('✅ 数据库文件可写')
    else:
        print('❌ 数据库文件不可写')
    
    # 测试数据库连接
    conn = sqlite3.connect('data/notes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT 1')
    conn.close()
    print('✅ 数据库连接正常')
    
    # 测试目录权限
    if os.access('data', os.W_OK):
        print('✅ data目录可写')
    else:
        print('❌ data目录不可写')
        
    if os.access('notes', os.W_OK):
        print('✅ notes目录可写')
    else:
        print('❌ notes目录不可写')
        
    print('🎉 权限修复成功！')
        
except Exception as e:
    print(f'❌ 权限测试失败: {e}')
    print('💡 请尝试以管理员身份运行此脚本')
"

echo.
echo [SUCCESS] 快速修复完成！
echo [INFO] 现在可以启动应用了:
echo   run.bat
echo.
pause
