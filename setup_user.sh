#!/bin/bash

# 智能笔记管理器 - 专用用户设置脚本
# 创建专用用户运行应用，避免权限问题

echo "👤 设置智能笔记管理器专用用户..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] 此脚本需要root权限运行${NC}"
    echo -e "${YELLOW}请使用: sudo ./setup_user.sh${NC}"
    exit 1
fi

# 设置变量
APP_USER="note-ai-user"
APP_DIR=$(pwd)
APP_NAME="note-ai-manager"

echo -e "${BLUE}[INFO] 应用目录: $APP_DIR${NC}"

# 创建专用用户
echo -e "${BLUE}[INFO] 创建专用用户: $APP_USER${NC}"
if id "$APP_USER" &>/dev/null; then
    echo -e "${YELLOW}[WARN] 用户 $APP_USER 已存在${NC}"
else
    useradd -m -s /bin/bash -d /home/$APP_USER $APP_USER
    echo -e "${GREEN}[SUCCESS] 用户 $APP_USER 创建成功${NC}"
fi

# 设置目录权限
echo -e "${BLUE}[INFO] 设置目录权限...${NC}"
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR
chmod +x $APP_DIR/*.sh

# 创建systemd服务文件
echo -e "${BLUE}[INFO] 创建systemd服务...${NC}"
cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=Note AI Manager
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/start.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd
systemctl daemon-reload

echo -e "${GREEN}[SUCCESS] 专用用户设置完成！${NC}"
echo ""
echo -e "${BLUE}[INFO] 使用方法:${NC}"
echo -e "${YELLOW}1. 启动服务: sudo systemctl start $APP_NAME${NC}"
echo -e "${YELLOW}2. 停止服务: sudo systemctl stop $APP_NAME${NC}"
echo -e "${YELLOW}3. 查看状态: sudo systemctl status $APP_NAME${NC}"
echo -e "${YELLOW}4. 开机自启: sudo systemctl enable $APP_NAME${NC}"
echo -e "${YELLOW}5. 查看日志: sudo journalctl -u $APP_NAME -f${NC}"
echo ""
echo -e "${BLUE}[INFO] 或者直接以专用用户身份运行:${NC}"
echo -e "${YELLOW}sudo -u $APP_USER ./start.sh${NC}"
