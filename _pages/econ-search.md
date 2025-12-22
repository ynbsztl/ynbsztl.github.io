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
  <h1>经济学文献检索系统</h1>
  
  <div class="info">
    <strong>关于此系统：</strong> 这是一个专门用于检索经济学期刊文献的工具，数据来源于RePEc，支持关键词搜索和AI语义搜索。
  </div>

  <div id="api-status" class="info" style="display:none;">
    <strong>API状态：</strong> <span id="status-text">检查中...</span>
  </div>

  <div class="search-form">
    <div class="search-mode-toggle">
      <button class="toggle-btn active" onclick="switchMode('keyword')" id="keyword-btn">关键词搜索</button>
      <button class="toggle-btn" onclick="switchMode('ai')" id="ai-btn">AI语义搜索</button>
    </div>

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

      <div class="form-group" id="similarity-group" style="display:none;">
        <label for="min-similarity">最小相似度阈值</label>
        <input type="number" id="min-similarity" class="form-control" value="0.5" min="0" max="1" step="0.05">
      </div>

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

<script>
let currentMode = 'keyword';
let journals = {
  'top5': ['aer', 'jpe', 'qje', 'ecta', 'restud'],
  'general': ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aeri', 'restat', 'jeea', 'eer', 'ej', 'qe'],
  'survey': ['jep', 'jel', 'are'],
  'all': ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aejmac', 'aejmic', 'aejapp', 'aejpol', 'aeri', 'jpemic', 'jpemac', 'restat', 'jeea', 'eer', 'ej', 'jep', 'jel', 'are', 'qe', 'jeg', 'jet', 'te', 'joe', 'jme', 'red', 'rand', 'jole', 'jhr', 'jie', 'ier', 'jpube', 'jde', 'jeh', 'jue', 'jhe']
};

let journalNames = {
  'aer': 'American Economic Review',
  'jpe': 'Journal of Political Economy',
  'qje': 'Quarterly Journal of Economics',
  'ecta': 'Econometrica',
  'restud': 'Review of Economic Studies',
  'aejmac': 'AEJ Macroeconomics',
  'aejmic': 'AEJ Microeconomics',
  'aejapp': 'AEJ Applied Economics',
  'aejpol': 'AEJ Economic Policy',
  'aeri': 'AER Insights',
  'jpemic': 'JPE Microeconomics',
  'jpemac': 'JPE Macroeconomics',
  'restat': 'Review of Economics and Statistics',
  'jeea': 'Journal of the European Economic Association',
  'eer': 'European Economic Review',
  'ej': 'Economic Journal',
  'jep': 'Journal of Economic Perspectives',
  'jel': 'Journal of Economic Literature',
  'are': 'Annual Review of Economics',
  'qe': 'Quantitative Economics',
  'jeg': 'Journal of Economic Growth',
  'jet': 'Journal of Economic Theory',
  'te': 'Theoretical Economics',
  'joe': 'Journal of Econometrics',
  'jme': 'Journal of Monetary Economics',
  'red': 'Review of Economic Dynamics',
  'rand': 'RAND Journal of Economics',
  'jole': 'Journal of Labor Economics',
  'jhr': 'Journal of Human Resources',
  'jie': 'Journal of International Economics',
  'ier': 'International Economic Review',
  'jpube': 'Journal of Public Economics',
  'jde': 'Journal of Development Economics',
  'jeh': 'Journal of Economic History',
  'jue': 'Journal of Urban Economics',
  'jhe': 'Journal of Health Economics'
};

function initializeJournals() {
  const container = document.getElementById('journal-select');
  
  // Add category options
  Object.keys(journals).forEach(category => {
    const div = document.createElement('div');
    div.className = 'journal-item';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category}" value="${category}" onchange="toggleCategory('${category}')">
      <label for="cat-${category}"><strong>${category.toUpperCase()}</strong></label>
    `;
    container.appendChild(div);
  });
  
  // Add individual journals
  journals.all.forEach(journal => {
    const div = document.createElement('div');
    div.className = 'journal-item';
    div.innerHTML = `
      <input type="checkbox" id="journal-${journal}" value="${journal}" checked>
      <label for="journal-${journal}">${journal} - ${journalNames[journal] || journal}</label>
    `;
    container.appendChild(div);
  });
}

function toggleCategory(category) {
  const checkbox = document.getElementById(`cat-${category}`);
  const isChecked = checkbox.checked;
  
  journals[category].forEach(journal => {
    const journalCheckbox = document.getElementById(`journal-${journal}`);
    if (journalCheckbox) {
      journalCheckbox.checked = isChecked;
    }
  });
}

function switchMode(mode) {
  currentMode = mode;
  
  // Update button states
  document.getElementById('keyword-btn').classList.toggle('active', mode === 'keyword');
  document.getElementById('ai-btn').classList.toggle('active', mode === 'ai');
  
  // Show/hide similarity controls
  document.getElementById('similarity-group').style.display = mode === 'ai' ? 'block' : 'none';
  
  // Update sort options
  const sortSelect = document.getElementById('sort-by');
  const similarityOption = sortSelect.querySelector('option[value="similarity"]');
  similarityOption.style.display = mode === 'ai' ? 'block' : 'none';
  
  // Show/hide help sections
  document.getElementById('keyword-help').style.display = mode === 'keyword' ? 'block' : 'none';
  document.getElementById('ai-help').style.display = mode === 'ai' ? 'block' : 'none';
  
  // Update placeholder
  const queryInput = document.getElementById('query');
  if (mode === 'ai') {
    queryInput.placeholder = '输入自然语言查询，如："minimum wage impact on employment"...';
  } else {
    queryInput.placeholder = '输入搜索关键词...';
  }
}

function getSelectedJournals() {
  const selected = [];
  journals.all.forEach(journal => {
    const checkbox = document.getElementById(`journal-${journal}`);
    if (checkbox && checkbox.checked) {
      selected.push(journal);
    }
  });
  return selected;
}

function clearForm() {
  document.getElementById('query').value = '';
  document.getElementById('year-from').value = '1980';
  document.getElementById('year-to').value = '2024';
  document.getElementById('sort-by').value = 'recent';
  document.getElementById('max-results').value = '50';
  document.getElementById('min-similarity').value = '0.5';
  document.getElementById('show-abstract').checked = false;
  
  // Reset journal selections
  journals.all.forEach(journal => {
    const checkbox = document.getElementById(`journal-${journal}`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
  
  // Clear results
  document.getElementById('results-container').innerHTML = '';
}

function displayResults(results, total) {
  const container = document.getElementById('results-container');
  
  if (results.length === 0) {
    container.innerHTML = '<div class="info">未找到匹配的文章。请尝试调整搜索条件。</div>';
    return;
  }
  
  let html = `<h3>搜索结果 (共找到 ${total} 篇文章)</h3>`;
  
  results.forEach((paper, index) => {
    html += `
      <div class="result-item">
        <div class="result-title">
          ${paper.similarity ? `<span class="similarity-badge">${paper.similarity.toFixed(3)}</span>` : ''}
          ${index + 1}. ${paper.url ? `<a href="${paper.url}" target="_blank">${paper.title}</a>` : paper.title}
        </div>
        <div class="result-meta">
          ${paper.authors} (${paper.year}) - <strong>${paper.journal}</strong>
        </div>
        ${document.getElementById('show-abstract').checked && paper.abstract ? 
          `<div class="result-abstract">${paper.abstract}</div>` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function showError(message) {
  const container = document.getElementById('results-container');
  container.innerHTML = `<div class="error"><strong>错误：</strong> ${message}</div>`;
}

function showLoading() {
  const container = document.getElementById('results-container');
  container.innerHTML = '<div class="loading">正在搜索中，请稍候...</div>';
}

// API configuration
// - 本地开发：默认使用 http://localhost:5000
// - 线上部署：请在 _config.yml 里配置 site.econ_search_api_base_url（必须是 https）
const API_BASE_URL_FROM_CONFIG = "{{ site.econ_search_api_base_url | default: '' }}";
const IS_LOCALHOST = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
const API_BASE_URL = (API_BASE_URL_FROM_CONFIG && API_BASE_URL_FROM_CONFIG.trim())
  ? API_BASE_URL_FROM_CONFIG.trim().replace(/\/$/, '')
  : (IS_LOCALHOST ? 'http://localhost:5000' : '');

async function performSearch(searchParams) {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchParams.query,
        mode: searchParams.mode,
        journals: searchParams.journals,
        yearFrom: searchParams.yearFrom,
        yearTo: searchParams.yearTo,
        sortBy: searchParams.sortBy,
        maxResults: searchParams.maxResults,
        minSimilarity: searchParams.minSimilarity,
        searchAuthor: false // 暂时禁用作者搜索
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      results: data.results,
      total: data.total
    };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

document.getElementById('search-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const query = document.getElementById('query').value.trim();
  const yearFrom = parseInt(document.getElementById('year-from').value);
  const yearTo = parseInt(document.getElementById('year-to').value);
  const sortBy = document.getElementById('sort-by').value;
  const maxResults = parseInt(document.getElementById('max-results').value);
  const minSimilarity = parseFloat(document.getElementById('min-similarity').value);
  const selectedJournals = getSelectedJournals();
  const showAbstract = document.getElementById('show-abstract').checked;
  
  if (!query && currentMode === 'ai') {
    showError('AI搜索模式下请输入查询内容');
    return;
  }
  
  if (selectedJournals.length === 0) {
    showError('请至少选择一个期刊');
    return;
  }
  
  showLoading();
  
  try {
    const searchParams = {
      query,
      mode: currentMode,
      yearFrom,
      yearTo,
      sortBy,
      maxResults,
      minSimilarity,
      journals: selectedJournals,
      showAbstract
    };
    
    const response = await performSearch(searchParams);
    displayResults(response.results, response.total);
  } catch (error) {
    showError('搜索过程中发生错误，请稍后重试');
    console.error('Search error:', error);
  }
});

// Check API status
async function checkApiStatus() {
  const statusDiv = document.getElementById('api-status');
  const statusText = document.getElementById('status-text');

  // 线上未配置API：给出明确提示，并禁用搜索按钮
  if (!API_BASE_URL) {
    statusText.innerHTML = `❌ 未配置后端API。<br>
      这是静态站点页面，不能直接运行 Python/Flask。<br>
      请先部署 <code>econ-search-api</code>，然后在 <code>_config.yml</code> 设置 <code>econ_search_api_base_url</code>（https）。`;
    statusDiv.className = 'error';
    statusDiv.style.display = 'block';
    const submitBtn = document.querySelector('#search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  // https 页面调用 http API 会被浏览器拦截（Mixed Content）
  if (location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
    statusText.innerHTML = `❌ 当前页面为 HTTPS，但API是 HTTP：<code>${API_BASE_URL}</code><br>
      浏览器会拦截混合内容请求。请把API部署为 HTTPS 并更新配置。`;
    statusDiv.className = 'error';
    statusDiv.style.display = 'block';
    const submitBtn = document.querySelector('#search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (response.ok) {
      statusText.textContent = `✅ API服务正常运行（${API_BASE_URL}）`;
      statusDiv.className = 'info';
    } else {
      throw new Error('API响应异常');
    }
  } catch (error) {
    statusText.textContent = `❌ API服务不可用（${API_BASE_URL}），请检查后端服务是否启动`;
    statusDiv.className = 'error';
  }
  
  document.getElementById('api-status').style.display = 'block';
}

// Load journals from API
async function loadJournalsFromApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/journals`);
    if (response.ok) {
      const data = await response.json();
      // Update global journals object with API data
      journals = data.categories;
      journals.all = data.all;
      journalNames = data.names;
      initializeJournals();
    } else {
      // Fallback to static data
      initializeJournals();
    }
  } catch (error) {
    console.warn('Failed to load journals from API, using static data');
    initializeJournals();
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  checkApiStatus();
  loadJournalsFromApi();
});
</script>
