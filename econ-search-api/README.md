# Econ Search API

这是为主页经济学文献检索功能提供的Flask API后端。

## 功能特性

- 关键词搜索：支持复杂的关键词查询语法
- AI语义搜索：基于sentence-transformers的语义相似度搜索
- 期刊筛选：支持按期刊类别和具体期刊筛选
- 年份范围：支持按发表年份筛选
- 多种排序：按时间或相似度排序

## API端点

### GET /health
健康检查端点

### POST /search
主要搜索端点

请求体：
```json
{
  "query": "搜索查询",
  "mode": "keyword|ai",
  "journals": ["aer", "jpe", ...],
  "yearFrom": 1980,
  "yearTo": 2024,
  "sortBy": "recent|early|similarity",
  "maxResults": 50,
  "minSimilarity": 0.5,
  "searchAuthor": false
}
```

### GET /journals
获取可用期刊列表

### GET /stats
获取数据库统计信息

## 本地运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 确保Econ-Paper-Search数据可用：
```bash
# 数据文件应该在 ../Econ-Paper-Search/Data/
# 嵌入向量文件应该在 ../Econ-Paper-Search/Embeddings/
```

3. 运行API：
```bash
python app.py
```

API将在 http://localhost:5000 上运行。

## 部署

可以使用以下方式部署：

### 使用Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 使用Docker
```bash
# 构建镜像
docker build -t econ-search-api .

# 运行容器
docker run -p 5000:5000 econ-search-api
```

## 环境变量

- `PORT`: API端口 (默认: 5000)
- `DEBUG`: 调试模式 (默认: False)

## 注意事项

1. 首次启动时会加载所有数据到内存，可能需要几分钟时间
2. AI搜索需要预计算的嵌入向量文件
3. 建议在生产环境中使用Gunicorn等WSGI服务器
4. 大量并发请求时建议增加内存配置
