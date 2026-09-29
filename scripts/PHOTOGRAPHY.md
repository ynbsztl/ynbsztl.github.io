# 添加摄影帖子

1. 将原始 JPEG 放入 `files/Picture/你的文件夹/`。此目录不进入 Jekyll 构建输出，原图保留在本地。
2. 安装 Python Pillow 后运行（已有 Pillow 无需重复安装）：

   ```sh
   python3 scripts/build_photography.py files/Picture/你的文件夹 your-album-slug
   ```

   生成 900px、2000px 的网页照片及 `_data/photography/your-album-slug.json`。数据来自 EXIF，不从文件夹名猜测日期；缺少的参数不显示。时间为相机记录的本地时间。网页照片保留色彩配置、不复制 EXIF/GPS。
3. 复制 `_photography/wuhan-zoo-2026-06-09.md` 为新帖子，修改标题、日期、地点、album、封面与地图。日期使用拍摄日期。正文写在第二个 `---` 后，可添加 Markdown 随笔。
4. 地图 latitude / longitude 使用 OpenStreetMap 的 WGS84 坐标。不要直接填入高德 GCJ-02 坐标。`source` 记录位置来源，`directions` 可填高德地点页。不需要地图时删除整个 map 字段。
5. 提交帖子、生成的数据和 `assets/photography/` 下的照片、模板等网站文件。网站会自动将新帖子加入 Photography 列表，并按日期倒序排列。

地图使用随站点提供的 Leaflet 1.9.4 和 OpenStreetMap 在线地图瓦片，支持拖动、缩放与位置标记，不需要 API key；加载依赖访客网络能访问 OpenStreetMap。同时保留高德地点链接。
