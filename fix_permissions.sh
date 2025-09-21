#!/bin/bash

# 智能笔记管理器 - Linux权限修复脚本
# 解决 "attempt to write a readonly database" 问题

echo "🔧 开始修复智能笔记管理器权限问题..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查当前目录
if [ ! -f "data/notes.db" ]; then
    echo -e "${RED}[ERROR] 未找到数据库文件，请确保在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}[INFO] 检查当前权限状态...${NC}"

# 显示当前权限
echo -e "${YELLOW}当前目录权限:${NC}"
ls -la data/
echo ""

# 修复目录权限
echo -e "${BLUE}[INFO] 修复目录权限...${NC}"
chmod 755 data/
chmod 755 notes/ 2>/dev/null || echo -e "${YELLOW}[WARN] notes目录不存在，将自动创建${NC}"

# 修复数据库文件权限
echo -e "${BLUE}[INFO] 修复数据库文件权限...${NC}"
chmod 664 data/notes.db

# 确保目录存在
mkdir -p data
mkdir -p notes

# 设置正确的所有者（如果可能）
if [ -w "/" ]; then
    echo -e "${BLUE}[INFO] 设置文件所有者...${NC}"
    chown -R $(whoami):$(whoami) data/ notes/ 2>/dev/null || echo -e "${YELLOW}[WARN] 无法设置所有者，继续执行${NC}"
fi

# 检查修复结果
echo -e "${BLUE}[INFO] 验证权限修复结果...${NC}"
echo -e "${YELLOW}修复后的权限:${NC}"
ls -la data/

# 测试数据库写入权限
echo -e "${BLUE}[INFO] 测试数据库写入权限...${NC}"
python3 -c "
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

echo ""
echo -e "${GREEN}[SUCCESS] 权限修复完成！${NC}"
echo -e "${BLUE}[INFO] 现在可以重新启动应用:${NC}"
echo -e "${YELLOW}  ./start.sh${NC}"
echo ""
echo -e "${BLUE}[INFO] 如果问题仍然存在，请尝试以下解决方案:${NC}"
echo -e "${YELLOW}1. 使用sudo运行: sudo ./start.sh${NC}"
echo -e "${YELLOW}2. 检查SELinux状态: getenforce${NC}"
echo -e "${YELLOW}3. 检查磁盘空间: df -h${NC}"
echo -e "${YELLOW}4. 检查文件系统: mount | grep $(pwd)${NC}"
