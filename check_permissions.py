#!/usr/bin/env python3
"""
智能笔记管理器 - 权限检查和修复工具
解决 "attempt to write a readonly database" 问题
"""

import os
import sys
import sqlite3
import stat
import platform
from pathlib import Path

# 颜色输出
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_colored(text, color=Colors.WHITE):
    """打印彩色文本"""
    print(f"{color}{text}{Colors.END}")

def check_file_permissions(file_path):
    """检查文件权限"""
    if not file_path.exists():
        return False, "文件不存在"
    
    try:
        # 检查读权限
        if not os.access(str(file_path), os.R_OK):
            return False, "无读权限"
        
        # 检查写权限
        if not os.access(str(file_path), os.W_OK):
            return False, "无写权限"
        
        # 获取文件状态
        stat_info = file_path.stat()
        mode = stat_info.st_mode
        
        # 检查是否为只读文件
        if not (mode & stat.S_IWRITE):
            return False, "文件被设置为只读"
        
        return True, "权限正常"
    
    except Exception as e:
        return False, f"权限检查失败: {e}"

def check_directory_permissions(dir_path):
    """检查目录权限"""
    if not dir_path.exists():
        return False, "目录不存在"
    
    try:
        # 检查读权限
        if not os.access(str(dir_path), os.R_OK):
            return False, "无读权限"
        
        # 检查写权限
        if not os.access(str(dir_path), os.W_OK):
            return False, "无写权限"
        
        # 检查执行权限
        if not os.access(str(dir_path), os.X_OK):
            return False, "无执行权限"
        
        return True, "权限正常"
    
    except Exception as e:
        return False, f"权限检查失败: {e}"

def fix_file_permissions(file_path):
    """修复文件权限"""
    try:
        if file_path.exists():
            # 移除只读属性
            if platform.system() == "Windows":
                os.chmod(str(file_path), stat.S_IREAD | stat.S_IWRITE)
            else:
                os.chmod(str(file_path), 0o664)
            
            # 设置写权限
            os.chmod(str(file_path), stat.S_IREAD | stat.S_IWRITE)
            return True, "权限修复成功"
        else:
            return False, "文件不存在"
    
    except Exception as e:
        return False, f"权限修复失败: {e}"

def fix_directory_permissions(dir_path):
    """修复目录权限"""
    try:
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # 设置目录权限
        if platform.system() == "Windows":
            os.chmod(str(dir_path), stat.S_IREAD | stat.S_IWRITE | stat.S_IEXEC)
        else:
            os.chmod(str(dir_path), 0o755)
        
        return True, "权限修复成功"
    
    except Exception as e:
        return False, f"权限修复失败: {e}"

def test_database_connection(db_path):
    """测试数据库连接"""
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # 测试读操作
        cursor.execute("SELECT 1")
        cursor.fetchone()
        
        # 测试写操作
        cursor.execute("CREATE TABLE IF NOT EXISTS test_table (id INTEGER)")
        cursor.execute("INSERT INTO test_table (id) VALUES (1)")
        conn.commit()
        
        # 清理测试表
        cursor.execute("DROP TABLE test_table")
        conn.commit()
        
        conn.close()
        return True, "数据库连接和写入测试成功"
    
    except sqlite3.OperationalError as e:
        if "readonly database" in str(e).lower():
            return False, f"数据库只读错误: {e}"
        else:
            return False, f"数据库操作错误: {e}"
    except Exception as e:
        return False, f"数据库连接失败: {e}"

def main():
    """主函数"""
    print_colored("🔧 智能笔记管理器 - 权限检查和修复工具", Colors.BOLD + Colors.CYAN)
    print_colored("=" * 60, Colors.CYAN)
    
    # 检查当前目录
    current_dir = Path.cwd()
    data_dir = current_dir / "data"
    notes_dir = current_dir / "notes"
    db_file = data_dir / "notes.db"
    
    print_colored(f"\n📁 当前工作目录: {current_dir}", Colors.BLUE)
    print_colored(f"📁 数据目录: {data_dir}", Colors.BLUE)
    print_colored(f"📁 笔记目录: {notes_dir}", Colors.BLUE)
    print_colored(f"🗄️ 数据库文件: {db_file}", Colors.BLUE)
    
    # 检查系统信息
    print_colored(f"\n💻 系统信息:", Colors.BLUE)
    print_colored(f"   操作系统: {platform.system()} {platform.release()}", Colors.WHITE)
    print_colored(f"   Python版本: {sys.version}", Colors.WHITE)
    
    # 检查目录权限
    print_colored(f"\n📂 检查目录权限:", Colors.BLUE)
    
    # 检查数据目录
    data_ok, data_msg = check_directory_permissions(data_dir)
    if data_ok:
        print_colored(f"   ✅ data目录: {data_msg}", Colors.GREEN)
    else:
        print_colored(f"   ❌ data目录: {data_msg}", Colors.RED)
    
    # 检查笔记目录
    notes_ok, notes_msg = check_directory_permissions(notes_dir)
    if notes_ok:
        print_colored(f"   ✅ notes目录: {data_msg}", Colors.GREEN)
    else:
        print_colored(f"   ❌ notes目录: {notes_msg}", Colors.RED)
    
    # 检查数据库文件权限
    print_colored(f"\n🗄️ 检查数据库文件权限:", Colors.BLUE)
    
    db_ok, db_msg = check_file_permissions(db_file)
    if db_ok:
        print_colored(f"   ✅ 数据库文件: {db_msg}", Colors.GREEN)
    else:
        print_colored(f"   ❌ 数据库文件: {db_msg}", Colors.RED)
    
    # 测试数据库连接
    print_colored(f"\n🔗 测试数据库连接:", Colors.BLUE)
    
    if db_file.exists():
        conn_ok, conn_msg = test_database_connection(db_file)
        if conn_ok:
            print_colored(f"   ✅ 数据库连接: {conn_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ 数据库连接: {conn_msg}", Colors.RED)
    else:
        print_colored(f"   ⚠️ 数据库文件不存在，将自动创建", Colors.YELLOW)
    
    # 自动修复权限
    print_colored(f"\n🔧 自动修复权限:", Colors.BLUE)
    
    # 修复数据目录
    if not data_ok:
        fix_ok, fix_msg = fix_directory_permissions(data_dir)
        if fix_ok:
            print_colored(f"   ✅ data目录修复: {fix_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ data目录修复失败: {fix_msg}", Colors.RED)
    
    # 修复笔记目录
    if not notes_ok:
        fix_ok, fix_msg = fix_directory_permissions(notes_dir)
        if fix_ok:
            print_colored(f"   ✅ notes目录修复: {fix_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ notes目录修复失败: {fix_msg}", Colors.RED)
    
    # 修复数据库文件
    if not db_ok and db_file.exists():
        fix_ok, fix_msg = fix_file_permissions(db_file)
        if fix_ok:
            print_colored(f"   ✅ 数据库文件修复: {fix_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ 数据库文件修复失败: {fix_msg}", Colors.RED)
    
    # 重新测试
    print_colored(f"\n🔄 重新测试权限:", Colors.BLUE)
    
    # 重新检查数据目录
    data_ok, data_msg = check_directory_permissions(data_dir)
    if data_ok:
        print_colored(f"   ✅ data目录: {data_msg}", Colors.GREEN)
    else:
        print_colored(f"   ❌ data目录: {data_msg}", Colors.RED)
    
    # 重新检查笔记目录
    notes_ok, notes_msg = check_directory_permissions(notes_dir)
    if notes_ok:
        print_colored(f"   ✅ notes目录: {notes_msg}", Colors.GREEN)
    else:
        print_colored(f"   ❌ notes目录: {notes_msg}", Colors.RED)
    
    # 重新检查数据库文件
    if db_file.exists():
        db_ok, db_msg = check_file_permissions(db_file)
        if db_ok:
            print_colored(f"   ✅ 数据库文件: {db_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ 数据库文件: {db_msg}", Colors.RED)
        
        # 重新测试数据库连接
        conn_ok, conn_msg = test_database_connection(db_file)
        if conn_ok:
            print_colored(f"   ✅ 数据库连接: {conn_msg}", Colors.GREEN)
        else:
            print_colored(f"   ❌ 数据库连接: {conn_msg}", Colors.RED)
    
    # 总结
    print_colored(f"\n📋 检查总结:", Colors.BOLD + Colors.CYAN)
    
    all_ok = data_ok and notes_ok and (db_ok if db_file.exists() else True)
    
    if all_ok:
        print_colored("   ✅ 所有权限检查通过！", Colors.GREEN)
        print_colored("   🚀 现在可以正常启动应用了", Colors.GREEN)
    else:
        print_colored("   ❌ 仍有权限问题需要解决", Colors.RED)
        print_colored("   💡 建议解决方案:", Colors.YELLOW)
        print_colored("      1. 以管理员身份运行此脚本", Colors.WHITE)
        print_colored("      2. 检查防病毒软件是否阻止了文件访问", Colors.WHITE)
        print_colored("      3. 检查磁盘空间是否充足", Colors.WHITE)
        print_colored("      4. 检查文件是否被其他程序占用", Colors.WHITE)
    
    print_colored(f"\n🎯 下一步操作:", Colors.BOLD + Colors.CYAN)
    print_colored("   1. 运行权限修复脚本: python check_permissions.py", Colors.WHITE)
    print_colored("   2. 启动应用: python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000", Colors.WHITE)
    print_colored("   3. 或使用批处理脚本: run.bat (Windows) / ./run.sh (Linux)", Colors.WHITE)
    
    print_colored(f"\n" + "=" * 60, Colors.CYAN)
    print_colored("🔧 权限检查和修复完成！", Colors.BOLD + Colors.GREEN)

if __name__ == "__main__":
    main()
