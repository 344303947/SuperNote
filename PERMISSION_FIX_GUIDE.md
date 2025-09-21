# 智能笔记管理器 - 权限问题解决指南

## 问题描述

在Linux环境下运行智能笔记管理器时，可能会遇到以下错误：
```
attempt to write a readonly database
```

这是一个典型的数据库权限问题，通常由以下原因引起：

1. **数据库文件权限不足** - 文件被设置为只读
2. **目录权限问题** - 父目录没有写权限
3. **文件所有者不匹配** - 运行进程的用户与文件所有者不同
4. **SELinux限制** - 安全策略阻止写入操作
5. **磁盘空间不足** - 导致文件系统变为只读

## 解决方案

### 方案一：使用权限检查工具（推荐）

我们提供了专门的权限检查和修复工具：

#### Windows环境
```cmd
# 运行权限检查工具
python check_permissions.py

# 或使用快速修复脚本
quick_fix.bat
```

#### Linux环境
```bash
# 运行权限检查工具
python3 check_permissions.py

# 或使用权限修复脚本
chmod +x fix_permissions.sh
./fix_permissions.sh
```

### 方案二：手动修复权限

#### Windows环境
```cmd
# 1. 以管理员身份打开命令提示符
# 2. 切换到项目目录
cd C:\path\to\note-ai-manager

# 3. 设置目录权限
icacls data /grant Everyone:F /T
icacls notes /grant Everyone:F /T

# 4. 设置数据库文件权限
icacls data\notes.db /grant Everyone:F

# 5. 测试权限
python -c "import sqlite3; conn = sqlite3.connect('data/notes.db'); conn.execute('SELECT 1'); print('权限正常')"
```

#### Linux环境
```bash
# 1. 切换到项目目录
cd /path/to/note-ai-manager

# 2. 设置目录权限
chmod 755 data/
chmod 755 notes/

# 3. 设置数据库文件权限
chmod 664 data/notes.db

# 4. 设置文件所有者（如果需要）
chown -R $(whoami):$(whoami) data/ notes/

# 5. 测试权限
python3 -c "import sqlite3; conn = sqlite3.connect('data/notes.db'); conn.execute('SELECT 1'); print('权限正常')"
```

### 方案三：重新创建数据库

如果权限修复无效，可以尝试重新创建数据库：

```bash
# 1. 备份现有数据（如果有重要数据）
cp data/notes.db data/notes.db.backup

# 2. 删除现有数据库文件
rm data/notes.db

# 3. 重新启动应用，数据库会自动创建
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

## 预防措施

### 1. 正确的安装流程

#### Windows环境
```cmd
# 1. 以管理员身份运行命令提示符
# 2. 安装依赖
pip install -r requirements.txt

# 3. 设置权限
quick_fix.bat

# 4. 启动应用
run.bat
```

#### Linux环境
```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 设置权限
chmod +x fix_permissions.sh
./fix_permissions.sh

# 3. 启动应用
chmod +x run.sh
./run.sh
```

### 2. 定期权限检查

建议定期运行权限检查工具：

```bash
# 每周检查一次权限
python3 check_permissions.py
```

### 3. 系统级权限设置

#### Linux环境
```bash
# 创建专用用户（推荐）
sudo useradd -m -s /bin/bash note-ai-user
sudo chown -R note-ai-user:note-ai-user /path/to/note-ai-manager

# 以专用用户运行
sudo -u note-ai-user ./run.sh
```

## 故障排除

### 常见问题及解决方案

#### 1. 权限修复后仍然报错
```bash
# 检查SELinux状态
getenforce

# 如果SELinux启用，临时禁用
sudo setenforce 0

# 或设置SELinux上下文
sudo setsebool -P httpd_can_network_connect 1
```

#### 2. 磁盘空间不足
```bash
# 检查磁盘空间
df -h

# 清理不需要的文件
sudo apt autoremove
sudo apt autoclean
```

#### 3. 文件被其他程序占用
```bash
# 查找占用文件的进程
lsof data/notes.db

# 杀死占用进程
sudo kill -9 [PID]
```

#### 4. 防病毒软件阻止
- 将项目目录添加到防病毒软件的白名单
- 临时禁用实时保护进行测试

## 工具说明

### check_permissions.py
- **功能**：全面的权限检查和自动修复工具
- **特点**：彩色输出、详细诊断、自动修复
- **使用**：`python3 check_permissions.py`

### fix_permissions.sh
- **功能**：Linux专用权限修复脚本
- **特点**：支持多种Linux发行版、详细错误处理
- **使用**：`chmod +x fix_permissions.sh && ./fix_permissions.sh`

### quick_fix.bat
- **功能**：Windows快速权限修复脚本
- **特点**：一键修复、简单易用
- **使用**：双击运行或命令行执行

## 技术细节

### 数据库权限要求
- **读权限**：应用需要读取数据库内容
- **写权限**：应用需要创建、更新、删除记录
- **执行权限**：目录需要执行权限以访问文件

### 文件系统权限
- **data目录**：需要读写执行权限
- **notes目录**：需要读写执行权限
- **数据库文件**：需要读写权限

### 安全考虑
- 不要给数据库文件设置过于宽松的权限
- 定期检查文件权限设置
- 使用专用用户运行应用
- 定期备份重要数据

## 联系支持

如果以上解决方案都无法解决问题，请：

1. 运行 `python3 check_permissions.py` 获取详细诊断信息
2. 检查系统日志：`journalctl -u note-ai-manager -f`
3. 提供完整的错误信息和系统环境信息

---

**注意**：本指南适用于智能笔记管理器 v1.0.0 及以上版本。对于旧版本，可能需要手动调整部分步骤。
