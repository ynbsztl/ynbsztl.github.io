// Static (GitHub Pages only) keyword search for Econ Paper Search
// Loads JSON shards by year-range to avoid loading all data at once.
(() => {
  let currentMode = 'keyword'; // only keyword supported

  // Shards that exist in assets/econ-search/
  const SHARDS = [
    { key: 'b2000', label: '1850–1999', from: -Infinity, to: 1999, url: '/assets/econ-search/papers_b2000.json' },
    { key: '2000s', label: '2000–2009', from: 2000, to: 2009, url: '/assets/econ-search/papers_2000s.json' },
    { key: '2010s', label: '2010–2014', from: 2010, to: 2014, url: '/assets/econ-search/papers_2010s.json' },
    { key: '2015s', label: '2015–2019', from: 2015, to: 2019, url: '/assets/econ-search/papers_2015s.json' },
    { key: '2020s', label: '2020+', from: 2020, to: Infinity, url: '/assets/econ-search/papers_2020s.json' },
  ];

  const shardCache = new Map(); // key -> array of papers
  const shardLoading = new Map(); // key -> Promise

  // Journal metadata (fallback; matches original app list)
  const journalsAll = [
    'aer', 'jpe', 'qje', 'ecta', 'restud',
    'aejmac', 'aejmic', 'aejapp', 'aejpol', 'aeri', 'jpemic', 'jpemac',
    'restat', 'jeea', 'eer', 'ej',
    'jep', 'jel', 'are',
    'qe', 'jeg',
    'jet', 'te', 'joe',
    'jme', 'red', 'rand', 'jole', 'jhr',
    'jie', 'ier', 'jpube', 'jde',
    'jeh', 'jue', 'jhe',
    // Note: full set in original app is larger; can be extended later
  ];

  const journalCategories = {
    all: journalsAll,
    top5: ['aer', 'jpe', 'qje', 'ecta', 'restud'],
    general: ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aeri', 'restat', 'jeea', 'eer', 'ej', 'qe'],
    survey: ['jep', 'jel', 'are'],
  };

  const journalNames = {
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

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text, kind = 'info') {
    const box = $('data-status');
    const t = $('status-text');
    if (!box || !t) return;
    box.className = kind === 'error' ? 'error' : 'info';
    t.textContent = text;
  }

  function setSubmitDisabled(disabled) {
    const submitBtn = document.querySelector('#search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  function getYearMax() {
    return new Date().getFullYear();
  }

  function initYears() {
    const yearMax = getYearMax();
    const yf = $('year-from');
    const yt = $('year-to');
    if (yf) yf.max = String(yearMax);
    if (yt) yt.max = String(yearMax);
    if (yt && (!yt.value || Number(yt.value) < yearMax)) yt.value = String(yearMax);
  }

  function initJournalsUI() {
    const container = $('journal-select');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(journalCategories).forEach((cat) => {
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <input type="checkbox" id="cat-${cat}" value="${cat}">
        <label for="cat-${cat}"><strong>${cat.toUpperCase()}</strong></label>
      `;
      container.appendChild(div);
      const cb = div.querySelector('input');
      if (cb) cb.addEventListener('change', () => toggleCategory(cat));
    });

    journalsAll.forEach((j) => {
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <input type="checkbox" id="journal-${j}" value="${j}" checked>
        <label for="journal-${j}">${j} - ${(journalNames[j] || j)}</label>
      `;
      container.appendChild(div);
    });
  }

  function toggleCategory(cat) {
    const cb = document.getElementById(`cat-${cat}`);
    const checked = cb ? cb.checked : false;
    (journalCategories[cat] || []).forEach((j) => {
      const jcb = document.getElementById(`journal-${j}`);
      if (jcb) jcb.checked = checked;
    });
  }

  function getSelectedJournals() {
    const selected = [];
    journalsAll.forEach((j) => {
      const cb = document.getElementById(`journal-${j}`);
      if (cb && cb.checked) selected.push(j);
    });
    return selected;
  }

  function switchMode(mode) {
    // Only keyword supported; keep UI stable.
    currentMode = 'keyword';
    const keywordBtn = $('keyword-btn');
    const aiBtn = $('ai-btn');
    if (keywordBtn) keywordBtn.classList.add('active');
    if (aiBtn) aiBtn.classList.remove('active');
  }

  // Query parsing compatible with original:
  // - split by spaces unless contains quotes
  // - quoted phrases kept together
  // - token with "|" means OR of sub-tokens (no spaces)
  function parseQuery(q) {
    const query = (q || '').trim();
    if (!query) return { tokens: [], orGroups: [] };

    let tokens;
    if (query.includes(' ') && !query.includes('"')) {
      tokens = query.split(/\s+/).filter(Boolean);
    } else if (query.includes('"')) {
      // match "..." or non-space chunks
      tokens = query.match(/(?:"[^"]*"|[^\s"])+/g) || [];
      tokens = tokens.map((t) => t.replace(/"/g, '')).filter(Boolean);
    } else {
      tokens = [query];
    }

    const orGroups = [];
    const normal = [];
    for (const t of tokens) {
      if (t.includes('|')) {
        const parts = t.split('|').map((x) => x.trim()).filter(Boolean);
        if (parts.length) orGroups.push(parts);
      } else {
        normal.push(t);
      }
    }

    return { tokens: normal, orGroups };
  }

  function includesCI(hay, needle) {
    return hay.indexOf(needle) !== -1;
  }

  function paperMatches(p, parsed) {
    // search in title + abstract
    const info = `${p.title || ''} ${p.abstract || ''}`.toLowerCase();

    // AND tokens
    for (const t of parsed.tokens) {
      if (!includesCI(info, t.toLowerCase())) return false;
    }

    // OR groups: each group must have at least one match
    for (const group of parsed.orGroups) {
      let any = false;
      for (const part of group) {
        if (includesCI(info, part.toLowerCase())) {
          any = true;
          break;
        }
      }
      if (!any) return false;
    }

    return true;
  }

  function shardOverlapsYears(shard, yFrom, yTo) {
    return !(yTo < shard.from || yFrom > shard.to);
  }

  async function loadShard(shard) {
    if (shardCache.has(shard.key)) return shardCache.get(shard.key);
    if (shardLoading.has(shard.key)) return shardLoading.get(shard.key);

    const p = (async () => {
      const resp = await fetch(shard.url, { cache: 'force-cache' });
      if (!resp.ok) throw new Error(`加载数据失败：${shard.url} (HTTP ${resp.status})`);
      const data = await resp.json();
      shardCache.set(shard.key, data);
      return data;
    })();

    shardLoading.set(shard.key, p);
    try {
      return await p;
    } finally {
      shardLoading.delete(shard.key);
    }
  }

  async function loadNeededData(yFrom, yTo) {
    const need = SHARDS.filter((s) => shardOverlapsYears(s, yFrom, yTo));
    if (need.length === 0) return [];

    setStatus(`正在加载数据分片：${need.map((s) => s.key).join(', ')} ...`);
    setSubmitDisabled(true);

    const arrays = await Promise.all(need.map((s) => loadShard(s)));
    const all = arrays.flat();

    setStatus(`已加载 ${need.length} 个分片，共 ${all.length.toLocaleString()} 条记录（将按条件筛选）`);
    setSubmitDisabled(false);
    return all;
  }

  function sortResults(items, sortBy) {
    if (sortBy === 'early') {
      items.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else {
      // recent (default)
      items.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
  }

  function renderResults(results, total) {
    const container = $('results-container');
    if (!container) return;

    if (!results.length) {
      container.innerHTML = '<div class="info">未找到匹配的文章。请尝试调整搜索条件。</div>';
      return;
    }

    const showAbstract = $('show-abstract') ? $('show-abstract').checked : false;

    let html = `<h3>搜索结果 (共找到 ${total.toLocaleString()} 篇文章，展示前 ${results.length.toLocaleString()} 篇)</h3>`;
    results.forEach((p, idx) => {
      const title = p.title || '';
      const authors = p.authors || '';
      const year = p.year || '';
      const journal = p.journal || '';
      const url = p.url || '';
      const abstract = p.abstract || '';

      const titleHtml = url
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : `${title}`;

      html += `
        <div class="result-item">
          <div class="result-title">${idx + 1}. ${titleHtml}</div>
          <div class="result-meta">${authors} (${year}) - <strong>${journal}</strong></div>
          ${showAbstract && abstract ? `<div class="result-abstract">${escapeHtml(abstract)}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function showError(msg) {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = `<div class="error"><strong>错误：</strong> ${escapeHtml(msg)}</div>`;
  }

  function showLoading() {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">正在搜索中，请稍候...</div>';
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();

    const query = ($('query') ? $('query').value : '').trim();
    const yFrom = parseInt($('year-from') ? $('year-from').value : '1980', 10);
    const yTo = parseInt($('year-to') ? $('year-to').value : String(getYearMax()), 10);
    const sortBy = $('sort-by') ? $('sort-by').value : 'recent';
    const maxShow = Math.min(200, Math.max(1, parseInt($('max-results') ? $('max-results').value : '50', 10)));
    const selectedJournals = new Set(getSelectedJournals());

    if (Number.isNaN(yFrom) || Number.isNaN(yTo) || yFrom > yTo) {
      showError('年份范围不合法（Year from 不能大于 Year to）');
      return;
    }

    if (selectedJournals.size === 0) {
      showError('请至少选择一个期刊');
      return;
    }

    // Load needed shards
    showLoading();
    let data;
    try {
      data = await loadNeededData(yFrom, yTo);
    } catch (err) {
      showError(err && err.message ? err.message : '数据加载失败');
      setStatus('数据加载失败', 'error');
      setSubmitDisabled(false);
      return;
    }

    setStatus('正在筛选与检索（数据量大时可能需要几十秒）...');

    // Filter + match
    const parsed = parseQuery(query);
    const matched = [];
    let total = 0;

    for (const p of data) {
      const y = p.year;
      if (y < yFrom || y > yTo) continue;
      if (!selectedJournals.has(p.journal)) continue;

      // blank query means return all in range
      if (query) {
        if (!paperMatches(p, parsed)) continue;
      }

      total += 1;
      matched.push(p);
    }

    sortResults(matched, sortBy);
    const shown = matched.slice(0, maxShow);

    setStatus(`完成：匹配 ${total.toLocaleString()} 篇（已加载分片数据，前端本地检索）`);
    renderResults(shown, total);
  }

  function bind() {
    const form = $('search-form');
    if (form) form.addEventListener('submit', handleSearchSubmit);

    // Keep inline handlers working
    window.switchMode = switchMode;
    window.clearForm = () => {
      const yearMax = getYearMax();
      if ($('query')) $('query').value = '';
      if ($('year-from')) $('year-from').value = '1980';
      if ($('year-to')) $('year-to').value = String(yearMax);
      if ($('sort-by')) $('sort-by').value = 'recent';
      if ($('max-results')) $('max-results').value = '50';
      if ($('show-abstract')) $('show-abstract').checked = false;
      journalsAll.forEach((j) => {
        const cb = document.getElementById(`journal-${j}`);
        if (cb) cb.checked = true;
      });
      const container = $('results-container');
      if (container) container.innerHTML = '';
      setStatus('等待搜索（将按年份范围自动加载所需数据分片）');
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    initYears();
    initJournalsUI();
    bind();
    switchMode('keyword');
    setStatus('等待搜索（将按年份范围自动加载所需数据分片）');
  });
})();


