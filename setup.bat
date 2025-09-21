@echo off
echo 正在安装 Tailwind CSS 依赖...
call npm install
echo 正在构建 CSS...
call npm run build-css-prod
echo 安装和构建完成！现在可以启动项目了。
echo 运行 python start_new.py 启动后端服务
pause
