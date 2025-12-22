# 经济学文献检索功能集成说明

## 概述

我已经成功将GitHub上的Econ-Paper-Search项目集成到了你的Jekyll主页中。这个集成包括：

1. **前端页面** (`_pages/econ-search.md`) - 一个现代化的搜索界面
2. **后端API** (`econ-search-api/`) - Flask API服务
3. **导航集成** - 在主页导航菜单中添加了"Econ Search"链接

## 功能特性

### 🔍 双重搜索模式
- **关键词搜索**：传统的关键词匹配，支持复杂查询语法
- **AI语义搜索**：基于sentence-transformers的智能语义搜索

### 📚 丰富的筛选选项
- **期刊筛选**：支持Top5、General、Survey等期刊分类
- **年份范围**：可设定发表年份范围
- **结果排序**：按时间或相似度排序
- **结果数量**：可控制显示的最大结果数

### 🎯 高级功能
- **相似度阈值**：AI搜索支持设置最小相似度
- **摘要显示**：可选择是否显示论文摘要
- **实时状态**：API连接状态实时显示

## 文件结构

```
ynbsztl.github.io/
├── _pages/
│   └── econ-search.md          # 搜索页面
├── _data/
│   └── navigation.yml          # 更新了导航菜单
├── econ-search-api/            # API后端
│   ├── app.py                  # Flask应用主文件
│   ├── requirements.txt        # Python依赖
│   ├── run.sh                  # 启动脚本
│   ├── Dockerfile             # Docker配置
│   ├── docker-compose.yml     # Docker Compose配置
│   └── README.md              # API文档
├── Econ-Paper-Search/          # 原始项目（已存在）
│   ├── Code/                   # 搜索逻辑代码
│   ├── Data/                   # 论文数据
│   └── Embeddings/             # 预计算的嵌入向量
└── ECON_SEARCH_INTEGRATION.md  # 本说明文件
```

## 部署步骤

### 1. 启动后端API

#### 方法一：使用启动脚本（推荐）
```bash
cd econ-search-api
./run.sh
```

#### 方法二：手动启动
```bash
cd econ-search-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

#### 方法三：使用Docker
```bash
cd econ-search-api
docker-compose up -d
```

### 2. 启动Jekyll网站

```bash
# 在主目录下
bundle exec jekyll serve
```

### 3. 访问搜索功能

打开浏览器访问：`http://localhost:4000/econ-search/`

## API端点说明

### 主要端点

- `GET /health` - 健康检查
- `POST /search` - 执行搜索
- `GET /journals` - 获取期刊列表
- `GET /stats` - 获取数据统计

### 搜索API示例

```javascript
// POST /search
{
  "query": "minimum wage employment",
  "mode": "ai",
  "journals": ["aer", "jpe", "qje"],
  "yearFrom": 2000,
  "yearTo": 2024,
  "sortBy": "similarity",
  "maxResults": 50,
  "minSimilarity": 0.5
}
```

## 配置说明

### 前端配置

在 `_pages/econ-search.md` 中修改API地址：

```javascript
const API_BASE_URL = 'http://localhost:5000'; // 更改为实际的API地址
```

### 后端配置

环境变量：
- `PORT`: API端口（默认5000）
- `DEBUG`: 调试模式（默认False）

## 故障排除

### 常见问题

1. **API连接失败**
   - 确保后端服务正在运行
   - 检查防火墙设置
   - 验证API地址配置

2. **数据加载错误**
   - 确认Econ-Paper-Search目录存在
   - 检查数据文件完整性
   - 查看API日志

3. **AI搜索不可用**
   - 确认嵌入向量文件存在
   - 检查sentence-transformers安装
   - 查看内存使用情况

### 日志查看

```bash
# 查看API日志
tail -f econ-search-api/logs/app.log

# Docker日志
docker-compose logs -f econ-search-api
```

## 性能优化

### 内存优化
- 首次启动会加载所有数据到内存
- 建议至少4GB可用内存
- 可以考虑数据分片加载

### 响应优化
- 使用Gunicorn多进程部署
- 配置适当的超时时间
- 考虑添加缓存层

## 扩展功能

### 可能的改进
1. **搜索历史**：保存用户搜索历史
2. **收藏功能**：允许用户收藏感兴趣的论文
3. **导出功能**：支持导出搜索结果
4. **高级筛选**：添加更多筛选条件
5. **搜索建议**：提供搜索关键词建议

### 部署到生产环境
1. **使用HTTPS**：配置SSL证书
2. **负载均衡**：使用Nginx反向代理
3. **监控告警**：添加系统监控
4. **数据备份**：定期备份数据文件

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (Vanilla)
- **后端**：Python Flask
- **AI模型**：sentence-transformers
- **数据处理**：pandas, numpy
- **部署**：Docker, Gunicorn

## 联系支持

如果遇到问题，请检查：
1. 控制台错误信息
2. API服务状态
3. 数据文件完整性
4. 网络连接状况

---

**注意**：首次启动可能需要下载AI模型，请确保网络连接稳定。
