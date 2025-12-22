// Econ Search page script (externalized to avoid Markdown/HTML parsing issues)
(() => {
  let currentMode = 'keyword';

  // Journals fallback (will be overridden by API /journals when available)
  let journals = {
    top5: ['aer', 'jpe', 'qje', 'ecta', 'restud'],
    general: ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aeri', 'restat', 'jeea', 'eer', 'ej', 'qe'],
    survey: ['jep', 'jel', 'are'],
    all: [
      'aer', 'jpe', 'qje', 'ecta', 'restud',
      'aejmac', 'aejmic', 'aejapp', 'aejpol', 'aeri', 'jpemic', 'jpemac',
      'restat', 'jeea', 'eer', 'ej',
      'jep', 'jel', 'are',
      'qe', 'jeg',
      'jet', 'te', 'joe',
      'jme', 'red', 'rand', 'jole', 'jhr',
      'jie', 'ier', 'jpube', 'jde',
      'jeh', 'jue', 'jhe',
    ],
  };

  let journalNames = {
    aer: 'American Economic Review',
    jpe: 'Journal of Political Economy',
    qje: 'Quarterly Journal of Economics',
    ecta: 'Econometrica',
    restud: 'Review of Economic Studies',
    aejmac: 'AEJ Macroeconomics',
    aejmic: 'AEJ Microeconomics',
    aejapp: 'AEJ Applied Economics',
    aejpol: 'AEJ Economic Policy',
    aeri: 'AER Insights',
    jpemic: 'JPE Microeconomics',
    jpemac: 'JPE Macroeconomics',
    restat: 'Review of Economics and Statistics',
    jeea: 'Journal of the European Economic Association',
    eer: 'European Economic Review',
    ej: 'Economic Journal',
    jep: 'Journal of Economic Perspectives',
    jel: 'Journal of Economic Literature',
    are: 'Annual Review of Economics',
    qe: 'Quantitative Economics',
    jeg: 'Journal of Economic Growth',
    jet: 'Journal of Economic Theory',
    te: 'Theoretical Economics',
    joe: 'Journal of Econometrics',
    jme: 'Journal of Monetary Economics',
    red: 'Review of Economic Dynamics',
    rand: 'RAND Journal of Economics',
    jole: 'Journal of Labor Economics',
    jhr: 'Journal of Human Resources',
    jie: 'Journal of International Economics',
    ier: 'International Economic Review',
    jpube: 'Journal of Public Economics',
    jde: 'Journal of Development Economics',
    jeh: 'Journal of Economic History',
    jue: 'Journal of Urban Economics',
    jhe: 'Journal of Health Economics',
  };

  const getApiBaseUrl = () => {
    const fromConfig = (window.ECON_SEARCH_API_BASE_URL || '').trim();
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    let base = fromConfig || (isLocalhost ? 'http://localhost:5000' : '');
    if (base.endsWith('/')) base = base.slice(0, -1);
    return base;
  };

  const API_BASE_URL = getApiBaseUrl();

  function $(id) {
    return document.getElementById(id);
  }

  function setDisabledSubmit(disabled) {
    const submitBtn = document.querySelector('#search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  function initializeYearInputs() {
    const yearMax = new Date().getFullYear();
    const yearFrom = $('year-from');
    const yearTo = $('year-to');
    if (yearFrom) yearFrom.max = String(yearMax);
    if (yearTo) yearTo.max = String(yearMax);
    if (yearTo && (!yearTo.value || Number(yearTo.value) < yearMax)) yearTo.value = String(yearMax);
  }

  function initializeJournals() {
    const container = $('journal-select');
    if (!container) return;
    container.innerHTML = '';

    // Category options
    Object.keys(journals).forEach((category) => {
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <input type="checkbox" id="cat-${category}" value="${category}">
        <label for="cat-${category}"><strong>${category.toUpperCase()}</strong></label>
      `;
      container.appendChild(div);

      const catCb = div.querySelector('input');
      if (catCb) {
        catCb.addEventListener('change', () => toggleCategory(category));
      }
    });

    // Individual journals
    (journals.all || []).forEach((journal) => {
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <input type="checkbox" id="journal-${journal}" value="${journal}" checked>
        <label for="journal-${journal}">${journal} - ${(journalNames && journalNames[journal]) || journal}</label>
      `;
      container.appendChild(div);
    });
  }

  function toggleCategory(category) {
    const checkbox = document.getElementById(`cat-${category}`);
    const isChecked = checkbox ? checkbox.checked : false;

    (journals[category] || []).forEach((journal) => {
      const journalCheckbox = document.getElementById(`journal-${journal}`);
      if (journalCheckbox) journalCheckbox.checked = isChecked;
    });
  }

  function switchMode(mode) {
    currentMode = mode;

    const keywordBtn = $('keyword-btn');
    const aiBtn = $('ai-btn');
    if (keywordBtn) keywordBtn.classList.toggle('active', mode === 'keyword');
    if (aiBtn) aiBtn.classList.toggle('active', mode === 'ai');

    const similarityGroup = $('similarity-group');
    if (similarityGroup) similarityGroup.style.display = mode === 'ai' ? 'block' : 'none';

    const sortSelect = $('sort-by');
    if (sortSelect) {
      const similarityOption = sortSelect.querySelector('option[value="similarity"]');
      if (similarityOption) similarityOption.style.display = mode === 'ai' ? 'block' : 'none';
    }

    const keywordHelp = $('keyword-help');
    const aiHelp = $('ai-help');
    if (keywordHelp) keywordHelp.style.display = mode === 'keyword' ? 'block' : 'none';
    if (aiHelp) aiHelp.style.display = mode === 'ai' ? 'block' : 'none';

    const queryInput = $('query');
    if (queryInput) {
      queryInput.placeholder =
        mode === 'ai'
          ? '输入自然语言查询，如："minimum wage impact on employment"...'
          : '输入搜索关键词...';
    }
  }

  function getSelectedJournals() {
    const selected = [];
    (journals.all || []).forEach((journal) => {
      const checkbox = document.getElementById(`journal-${journal}`);
      if (checkbox && checkbox.checked) selected.push(journal);
    });
    return selected;
  }

  function clearForm() {
    const yearMax = new Date().getFullYear();
    if ($('query')) $('query').value = '';
    if ($('year-from')) $('year-from').value = '1980';
    if ($('year-to')) $('year-to').value = String(yearMax);
    if ($('sort-by')) $('sort-by').value = 'recent';
    if ($('max-results')) $('max-results').value = '50';
    if ($('min-similarity')) $('min-similarity').value = '0.5';
    if ($('show-abstract')) $('show-abstract').checked = false;

    (journals.all || []).forEach((journal) => {
      const checkbox = document.getElementById(`journal-${journal}`);
      if (checkbox) checkbox.checked = true;
    });

    if ($('results-container')) $('results-container').innerHTML = '';
  }

  function displayResults(results, total) {
    const container = $('results-container');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = '<div class="info">未找到匹配的文章。请尝试调整搜索条件。</div>';
      return;
    }

    const showAbstract = $('show-abstract') ? $('show-abstract').checked : false;

    let html = `<h3>搜索结果 (共找到 ${total} 篇文章)</h3>`;

    results.forEach((paper, index) => {
      const titleHtml = paper.url
        ? `<a href="${paper.url}" target="_blank" rel="noopener noreferrer">${paper.title}</a>`
        : `${paper.title}`;

      const similarityHtml =
        typeof paper.similarity === 'number'
          ? `<span class="similarity-badge">${paper.similarity.toFixed(3)}</span>`
          : '';

      const abstractHtml =
        showAbstract && paper.abstract
          ? `<div class="result-abstract">${paper.abstract}</div>`
          : '';

      html += `
        <div class="result-item">
          <div class="result-title">
            ${similarityHtml}
            ${index + 1}. ${titleHtml}
          </div>
          <div class="result-meta">
            ${paper.authors} (${paper.year}) - <strong>${paper.journal}</strong>
          </div>
          ${abstractHtml}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function showError(message) {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = `<div class="error"><strong>错误：</strong> ${message}</div>`;
  }

  function showLoading() {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">正在搜索中，请稍候...</div>';
  }

  async function performSearch(searchParams) {
    const resp = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchParams.query,
        mode: searchParams.mode,
        journals: searchParams.journals,
        yearFrom: searchParams.yearFrom,
        yearTo: searchParams.yearTo,
        sortBy: searchParams.sortBy,
        maxResults: searchParams.maxResults,
        minSimilarity: searchParams.minSimilarity,
        searchAuthor: false,
      }),
    });

    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try {
        const err = await resp.json();
        if (err && err.error) msg = err.error;
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await resp.json();
    return { results: data.results || [], total: data.total || 0 };
  }

  async function checkApiStatus() {
    const statusDiv = $('api-status');
    const statusText = $('status-text');
    if (!statusDiv || !statusText) return;

    // 未配置API（线上常见）
    if (!API_BASE_URL) {
      statusText.innerHTML =
        '❌ 未配置后端API。<br>' +
        '这是静态站点页面，不能直接运行 Python/Flask。<br>' +
        '请先部署 <code>econ-search-api</code>，然后在 <code>_config.yml</code> 设置 <code>econ_search_api_base_url</code>（https）。';
      statusDiv.className = 'error';
      statusDiv.style.display = 'block';
      setDisabledSubmit(true);
      return;
    }

    // https 页面调用 http API 会被浏览器拦截
    if (location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
      statusText.innerHTML =
        `❌ 当前页面为 HTTPS，但API是 HTTP：<code>${API_BASE_URL}</code><br>` +
        '浏览器会拦截混合内容请求。请把API部署为 HTTPS 并更新配置。';
      statusDiv.className = 'error';
      statusDiv.style.display = 'block';
      setDisabledSubmit(true);
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/health`);
      if (!resp.ok) throw new Error('Health check failed');
      statusText.textContent = `✅ API服务正常运行（${API_BASE_URL}）`;
      statusDiv.className = 'info';
      setDisabledSubmit(false);
    } catch (_) {
      statusText.textContent = `❌ API服务不可用（${API_BASE_URL}），请检查后端服务是否启动`;
      statusDiv.className = 'error';
      setDisabledSubmit(true);
    }

    statusDiv.style.display = 'block';
  }

  async function loadJournalsFromApi() {
    if (!API_BASE_URL) {
      initializeJournals();
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/journals`);
      if (!resp.ok) throw new Error('journals failed');
      const data = await resp.json();
      if (data && data.categories && data.all && data.names) {
        journals = data.categories;
        journals.all = data.all;
        journalNames = data.names;
      }
    } catch (_) {
      // fallback silently
    } finally {
      initializeJournals();
    }
  }

  function bindForm() {
    const form = $('search-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const query = ($('query') ? $('query').value : '').trim();
      const yearFrom = parseInt($('year-from') ? $('year-from').value : '1980', 10);
      const yearTo = parseInt($('year-to') ? $('year-to').value : String(new Date().getFullYear()), 10);
      const sortBy = $('sort-by') ? $('sort-by').value : 'recent';
      const maxResults = parseInt($('max-results') ? $('max-results').value : '50', 10);
      const minSimilarity = parseFloat($('min-similarity') ? $('min-similarity').value : '0.5');
      const selectedJournals = getSelectedJournals();

      if (!API_BASE_URL) {
        showError('未配置后端API，无法搜索。');
        return;
      }

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
        const res = await performSearch({
          query,
          mode: currentMode,
          yearFrom,
          yearTo,
          sortBy,
          maxResults,
          minSimilarity,
          journals: selectedJournals,
        });
        displayResults(res.results, res.total);
      } catch (err) {
        showError(`搜索失败：${err && err.message ? err.message : '未知错误'}`);
      }
    });
  }

  function exposeGlobals() {
    // Keep inline onclick handlers working without changing HTML
    window.switchMode = switchMode;
    window.clearForm = clearForm;
  }

  document.addEventListener('DOMContentLoaded', () => {
    exposeGlobals();
    initializeYearInputs();
    bindForm();
    // Default mode UI state
    switchMode('keyword');
    // Status + journals
    checkApiStatus();
    loadJournalsFromApi();
  });
})();


