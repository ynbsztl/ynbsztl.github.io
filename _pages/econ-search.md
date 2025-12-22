---
layout: single
title: "经济学文献检索"
permalink: /econ-search/
author_profile: true
---

<style>
.search-container {
  max-width: 1000px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.search-form {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.form-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.form-col {
  flex: 1;
  min-width: 200px;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

.search-mode-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.toggle-btn {
  padding: 8px 16px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: #007bff;
  color: white;
}

.results-container {
  margin-top: 30px;
}

.result-item {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.result-title a {
  color: #007bff;
  text-decoration: none;
}

.result-title a:hover {
  text-decoration: underline;
}

.result-meta {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.result-abstract {
  color: #555;
  line-height: 1.6;
  margin-top: 10px;
}

.similarity-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.info {
  background: #d1ecf1;
  color: #0c5460;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.journal-select {
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  padding: 10px;
}

.journal-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.journal-item input {
  margin-right: 8px;
}

.help-section {
  background: #e9ecef;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
}

.help-section h3 {
  margin-top: 0;
  color: #495057;
}

.help-section ul {
  margin-bottom: 0;
}

.help-section li {
  margin-bottom: 8px;
}
</style>

<div class="search-container">
  <!-- <h1>经济学文献检索系统</h1> -->
  
  <!-- <div class="info">
    <strong>关于此系统：</strong> 这是一个专门用于检索经济学期刊文献的工具，数据来源于RePEc，支持关键词搜索。
  </div> -->

  <div id="data-status" class="info">
    <strong>数据状态：</strong> <span id="status-text">等待搜索（将按年份范围自动加载所需数据分片）</span>
  </div>

  <div class="search-form">
    <!-- <div class="search-mode-toggle">
      <button class="toggle-btn active" onclick="switchMode('keyword')" id="keyword-btn">关键词搜索</button>
      <button class="toggle-btn" onclick="switchMode('ai')" id="ai-btn" disabled title="静态站点模式不支持AI语义检索">AI语义搜索（不可用）</button>
    </div> -->

    <form id="search-form">
      <div class="form-group">
        <label for="query">搜索查询</label>
        <input type="text" id="query" class="form-control" placeholder="输入搜索关键词或查询语句...">
      </div>

      <div class="form-row">
        <div class="form-col">
          <label for="year-from">起始年份</label>
          <input type="number" id="year-from" class="form-control" value="1980" min="1900" max="2024">
        </div>
        <div class="form-col">
          <label for="year-to">结束年份</label>
          <input type="number" id="year-to" class="form-control" value="2024" min="1900" max="2024">
        </div>
        <div class="form-col">
          <label for="sort-by">排序方式</label>
          <select id="sort-by" class="form-control">
            <option value="recent">最新发表</option>
            <option value="early">最早发表</option>
            <option value="similarity" style="display:none;">相似度</option>
          </select>
        </div>
        <div class="form-col">
          <label for="max-results">最大显示数量</label>
          <input type="number" id="max-results" class="form-control" value="50" min="1" max="200">
        </div>
      </div>

      <div class="form-group" id="similarity-group" style="display:none;"></div>

      <div class="form-group">
        <label>期刊选择</label>
        <div class="journal-select" id="journal-select">
          <!-- 期刊选项将通过JavaScript动态生成 -->
        </div>
      </div>

      <div class="form-group">
        <input type="checkbox" id="show-abstract"> 
        <label for="show-abstract" style="display:inline; margin-left:5px;">显示摘要</label>
      </div>

      <button type="submit" class="btn">开始搜索</button>
      <button type="button" class="btn btn-secondary" onclick="clearForm()">清空表单</button>
    </form>
  </div>

  <div id="results-container" class="results-container"></div>

  <div class="help-section">
    <h3>使用帮助</h3>
    <div id="keyword-help">
      <h4>关键词搜索</h4>
      <ul>
        <li>搜索会查找标题和摘要中包含<strong>所有关键词</strong>的文章（用空格分隔）</li>
        <li>搜索不区分大小写，支持部分匹配</li>
        <li>使用双引号""可以搜索<strong>精确短语</strong></li>
        <li>使用|符号可以匹配<strong>任一关键词</strong>（如：labor|employment）</li>
        <li>留空关键词将返回所选期刊的所有文章</li>
      </ul>
    </div>
    <div id="ai-help" style="display:none;">
      <h4>AI语义搜索</h4>
      <ul>
        <li>使用<strong>自然语言查询</strong>来查找语义相关的文章</li>
        <li><strong>完整的短语和句子</strong>比单个关键词效果更好</li>
        <li><strong>词序很重要</strong>；相同词汇在不同语境中含义不同</li>
        <li>示例："minimum wage impact on employment in asian countries"</li>
        <li><strong>相似度阈值</strong>用于过滤结果：0.5是经验法则</li>
      </ul>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/econ-search-static.js' | relative_url }}"></script>
