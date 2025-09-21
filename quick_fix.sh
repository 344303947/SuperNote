#!/bin/bash

# 智能笔记管理器 - 快速权限修复
# 一键解决数据库权限问题

echo "🚀 快速修复数据库权限问题..."

# 确保在正确目录
if [ ! -f "data/notes.db" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 修复权限
echo "🔧 修复文件权限..."
chmod 755 data/
chmod 664 data/notes.db
mkdir -p notes
chmod 755 notes/

# 如果数据库文件只读，尝试修复
if [ ! -w "data/notes.db" ]; then
    echo "🔧 修复数据库文件权限..."
    chmod +w data/notes.db
fi

# 测试权限
echo "🧪 测试权限..."
if [ -w "data/notes.db" ] && [ -w "data" ] && [ -w "notes" ]; then
    echo "✅ 权限修复成功！"
    echo "现在可以重新启动应用: ./start.sh"
else
    echo "❌ 权限修复失败，请尝试:"
    echo "sudo chown -R \$(whoami):\$(whoami) data/ notes/"
    echo "sudo chmod -R 755 data/ notes/"
fi
