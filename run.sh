#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] 未找到 python3，请先安装。"
  exit 1
fi

if [ ! -d .venv ]; then
  echo "[INFO] 创建虚拟环境 .venv ..."
  python3 -m venv .venv
fi

"$ROOT/.venv/bin/python" -m pip install --upgrade pip >/dev/null
echo "[INFO] 安装依赖 ..."
"$ROOT/.venv/bin/python" -m pip install -r requirements.txt

echo "[INFO] 启动应用 (新架构) ..."
exec "$ROOT/.venv/bin/python" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload


