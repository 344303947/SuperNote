#!/bin/bash
echo "正在安装 Tailwind CSS 依赖..."
npm install
echo "正在构建 CSS..."
npm run build-css-prod
echo "安装和构建完成！现在可以启动项目了。"
echo "运行 python main.py 启动后端服务"
