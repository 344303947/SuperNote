# 智能笔记管理器 - Linux版本使用指南

## 概述

智能笔记管理器现在提供了专门的Linux版本，包含一键安装和启动脚本，让Linux用户可以轻松部署和使用。

## 打包脚本说明

### 1. release-linux.bat - Linux专用打包脚本

**功能特点：**
- 专门为Linux环境优化
- 自动生成版本号（基于当前时间）
- 创建Linux专用的启动和安装脚本
- 包含颜色输出和详细的错误处理
- 支持多种Linux发行版（Ubuntu/CentOS/Debian/Fedora/Arch）
- 自动检测系统类型并提供相应的安装命令

**使用方法：**
```cmd
release-linux.bat
```

**输出目录：**
```
release/note-ai-manager-linux-v[版本号]/
├── backend/           # 后端代码
├── frontend/          # 前端代码  
├── data/             # 数据库文件
├── notes/            # 笔记文件
├── start.sh          # Linux启动脚本（带颜色输出）
├── install.sh        # Linux自动安装脚本
├── README.md         # Linux专用说明文档
└── note-ai-manager-linux-v[版本号].zip  # 压缩包
```

### 2. 与普通版本的区别

| 特性 | 普通版本 | Linux版本 |
|------|----------|-----------|
| 启动脚本 | start.bat | start.sh |
| 安装脚本 | 无 | install.sh |
| 系统检测 | 无 | 自动检测Linux发行版 |
| 颜色输出 | 无 | 彩色终端输出 |
| 错误处理 | 基础 | 详细的错误提示 |
| 依赖管理 | 手动 | 自动安装Python3 |

## Linux脚本详解

### start.sh - 主启动脚本

**主要功能：**
- 自动检测Python3环境
- 创建和管理虚拟环境
- 安装Python依赖包
- 检测端口占用并自动切换
- 启动FastAPI服务
- 彩色终端输出
- 详细的错误处理

**特色功能：**
```bash
# 颜色输出示例
echo -e "${GREEN}[INFO] 启动智能笔记管理器...${NC}"
echo -e "${RED}[ERROR] 依赖安装失败${NC}"
echo -e "${YELLOW}[WARN] 端口 8000 已被占用，尝试使用端口 8001${NC}"

# 自动端口检测
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}[WARN] 端口 $PORT 已被占用，尝试使用端口 8001${NC}"
    PORT=8001
fi

# 系统兼容性检查
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] 未找到 Python3，请先安装 Python3。${NC}"
    echo -e "${YELLOW}[INFO] 安装命令: sudo apt install python3 python3-pip (Ubuntu/Debian)${NC}"
    exit 1
fi
```

### install.sh - 自动安装脚本

**主要功能：**
- 自动检测Linux发行版
- 根据系统类型安装Python3和pip
- 安装Node.js（如果需要）
- 设置脚本执行权限
- 提供安装完成提示

**支持的Linux发行版：**
- Ubuntu/Debian: `sudo apt install python3 python3-pip python3-venv`
- CentOS/RHEL: `sudo yum install python3 python3-pip`
- Fedora: `sudo dnf install python3 python3-pip`
- Arch Linux: `sudo pacman -S python python-pip`

## Linux用户使用流程

### 第一步：获取Linux版本

**方法一：使用打包脚本**
```cmd
# 在Windows开发机器上运行
release-linux.bat
```

**方法二：从现有版本转换**
```bash
# 如果有现有的发布版本，可以手动创建Linux脚本
```

### 第二步：传输到Linux服务器

**使用SCP传输：**
```bash
scp -r note-ai-manager-linux-v[版本号]/ user@server:/path/to/destination/
```

**使用SFTP传输：**
```bash
sftp user@server
put -r note-ai-manager-linux-v[版本号]/
```

### 第三步：Linux服务器部署

**自动安装（推荐）：**
```bash
cd note-ai-manager-linux-v[版本号]
chmod +x install.sh
./install.sh
```

**手动安装：**
```bash
# 安装Python3
sudo apt update
sudo apt install python3 python3-pip python3-venv

# 设置权限
chmod +x start.sh

# 启动应用
./start.sh
```

### 第四步：访问应用

```bash
# 本地访问
http://127.0.0.1:8000

# 局域网访问
http://[服务器IP]:8000
```

## 高级使用

### 后台运行

```bash
# 使用nohup后台运行
nohup ./start.sh > app.log 2>&1 &

# 查看运行状态
ps aux | grep uvicorn

# 查看日志
tail -f app.log

# 停止服务
pkill -f "uvicorn backend.app.main:app"
```

### 系统服务配置

**创建systemd服务文件：**
```bash
sudo nano /etc/systemd/system/note-ai-manager.service
```

**服务文件内容：**
```ini
[Unit]
Description=Note AI Manager
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/note-ai-manager-linux-v[版本号]
ExecStart=/path/to/note-ai-manager-linux-v[版本号]/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**启用服务：**
```bash
sudo systemctl daemon-reload
sudo systemctl enable note-ai-manager
sudo systemctl start note-ai-manager
sudo systemctl status note-ai-manager
```

### 反向代理配置（Nginx）

**Nginx配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 故障排除

### 常见问题及解决方案

**1. Python3未安装**
```bash
# 检查Python3版本
python3 --version

# 安装Python3（Ubuntu/Debian）
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**2. 依赖安装失败**
```bash
# 使用国内镜像源
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r backend/requirements.txt

# 升级pip
python3 -m pip install --upgrade pip
```

**3. 端口被占用**
```bash
# 查看端口占用
lsof -i :8000
netstat -tulpn | grep :8000

# 杀死占用进程
sudo kill -9 [PID]
```

**4. 权限问题**
```bash
# 设置执行权限
chmod +x start.sh
chmod +x install.sh

# 设置目录权限
chmod -R 755 .
```

**5. 虚拟环境问题**
```bash
# 删除旧的虚拟环境
rm -rf .venv

# 重新创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 日志分析

**查看启动日志：**
```bash
./start.sh 2>&1 | tee startup.log
```

**查看系统日志：**
```bash
# 查看systemd服务日志
sudo journalctl -u note-ai-manager -f

# 查看系统日志
tail -f /var/log/syslog | grep note-ai-manager
```

## 性能优化

### 生产环境优化

**1. 使用Gunicorn代替uvicorn：**
```bash
# 安装Gunicorn
pip install gunicorn

# 修改启动脚本
gunicorn backend.app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
```

**2. 配置环境变量：**
```bash
export PYTHONPATH=/path/to/note-ai-manager-linux-v[版本号]
export DATABASE_URL=sqlite:///data/notes.db
```

**3. 系统资源优化：**
```bash
# 增加文件描述符限制
ulimit -n 65536

# 优化内存使用
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
```

## 安全建议

### 基本安全措施

**1. 用户权限：**
```bash
# 创建专用用户
sudo useradd -m -s /bin/bash note-ai-user
sudo chown -R note-ai-user:note-ai-user /path/to/note-ai-manager

# 以专用用户运行
sudo -u note-ai-user ./start.sh
```

**2. 防火墙配置：**
```bash
# 只允许本地访问
sudo ufw allow from 127.0.0.1 to any port 8000

# 或者允许特定IP段
sudo ufw allow from 192.168.1.0/24 to any port 8000
```

**3. 定期备份：**
```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_$DATE.tar.gz" data/ notes/
```

## 总结

Linux版本的智能笔记管理器提供了：

✅ **一键安装** - 自动检测系统并安装依赖  
✅ **彩色输出** - 友好的终端界面  
✅ **智能错误处理** - 详细的错误提示和解决方案  
✅ **多系统支持** - 支持主流Linux发行版  
✅ **生产就绪** - 支持后台运行和系统服务  
✅ **完整文档** - 详细的使用和故障排除指南  

现在Linux用户可以像使用Windows版本一样轻松部署和使用智能笔记管理器了！
