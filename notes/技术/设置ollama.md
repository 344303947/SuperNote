# 设置ollama
**分类：** 技术
**标签：** Linux, systemd, Ollama

sudo vim /etc/systemd/system/ollama.service
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo systemctl status ollama