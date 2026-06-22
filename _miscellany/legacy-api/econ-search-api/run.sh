#!/bin/bash

# Econ Search API 启动脚本

set -e

echo "=== Econ Search API 启动脚本 ==="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3"
    exit 1
fi

# 检查是否存在虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 检查数据文件
DATA_DIR="../Econ-Paper-Search/Data"
if [ ! -d "$DATA_DIR" ]; then
    echo "错误: 未找到数据目录 $DATA_DIR"
    echo "请确保 Econ-Paper-Search 目录存在并包含数据文件"
    exit 1
fi

if [ ! -f "$DATA_DIR/papers_2020s.csv" ]; then
    echo "错误: 未找到必需的数据文件 papers_2020s.csv"
    exit 1
fi

# 检查嵌入向量文件
EMBEDDINGS_DIR="../Econ-Paper-Search/Embeddings"
if [ ! -d "$EMBEDDINGS_DIR" ]; then
    echo "警告: 未找到嵌入向量目录 $EMBEDDINGS_DIR"
    echo "AI搜索功能将不可用"
fi

# 设置环境变量
export FLASK_APP=app.py
export FLASK_ENV=production

# 启动API服务
echo "启动 API 服务..."
echo "API 将在 http://localhost:5000 上运行"
echo "按 Ctrl+C 停止服务"

# 使用gunicorn启动（生产环境）
if command -v gunicorn &> /dev/null; then
    echo "使用 Gunicorn 启动..."
    gunicorn -w 2 -b 0.0.0.0:5000 --timeout 120 app:app
else
    echo "使用 Flask 开发服务器启动..."
    python3 app.py
fi
