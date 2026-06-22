// @ts-nocheck
// Static Chinese economics paper search backed by assets/cnki-search/*.json.
(() => {
  let yearMin = 1955;
  let yearMax = 2026;

  let shards = [
    { key: 'b1980', label: '1955-1979', from: -Infinity, to: 1979, url: '/assets/cnki-search/papers_b1980.json' },
    { key: '1980s', label: '1980-1989', from: 1980, to: 1989, url: '/assets/cnki-search/papers_1980s.json' },
    { key: '1990s', label: '1990-1999', from: 1990, to: 1999, url: '/assets/cnki-search/papers_1990s.json' },
    { key: '2000s', label: '2000-2009', from: 2000, to: 2009, url: '/assets/cnki-search/papers_2000s.json' },
    { key: '2010s', label: '2010-2019', from: 2010, to: 2019, url: '/assets/cnki-search/papers_2010s.json' },
    { key: '2020s', label: '2020+', from: 2020, to: Infinity, url: '/assets/cnki-search/papers_2020s.json' },
  ];

  let journals = [
    { name: '中国社会科学', count: 5361 },
    { name: '经济研究', count: 9245 },
    { name: '管理世界', count: 10526 },
    { name: '世界经济', count: 8346 },
    { name: '中国工业经济', count: 6663 },
    { name: '金融研究', count: 3919 },
    { name: '经济学(季刊)', count: 1981 },
  ];

  const shardCache = new Map();
  const shardLoading = new Map();
  let dataVersion = '';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function setStatus(text, kind = 'info') {
    const box = $('data-status');
    const status = $('status-text');
    if (!box || !status) return;
    box.className = kind === 'error' ? 'error' : 'data-status';
    status.textContent = text;
  }

  function setSubmitDisabled(disabled) {
    const submitBtn = document.querySelector('#cnki-search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  async function loadManifest() {
    try {
      const resp = await fetch('/assets/cnki-search/manifest.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const manifest = await resp.json();

      if (Number.isFinite(Number(manifest.year_min))) yearMin = Number(manifest.year_min);
      if (Number.isFinite(Number(manifest.year_max))) yearMax = Number(manifest.year_max);
      dataVersion = String(manifest.generated_at || manifest.source_mtime || '');
      if (Array.isArray(manifest.journals) && manifest.journals.length) journals = manifest.journals;
      if (Array.isArray(manifest.shards) && manifest.shards.length) {
        shards = manifest.shards.map((shard) => ({
          key: shard.key,
          label: shard.label,
          from: shard.from == null ? -Infinity : Number(shard.from),
          to: shard.to == null ? Infinity : Number(shard.to),
          url: shard.url,
        }));
      }
    } catch (_) {
      setStatus('Ready to search. Using built-in metadata because manifest.json could not be loaded.');
    }
  }

  function initYears() {
    const yf = $('year-from');
    const yt = $('year-to');
    if (yf) {
      yf.min = String(yearMin);
      yf.max = String(yearMax);
      yf.value = String(yearMin);
    }
    if (yt) {
      yt.min = String(yearMin);
      yt.max = String(yearMax);
      yt.value = String(yearMax);
    }
  }

  function initJournalsUI() {
    const container = $('journal-select');
    if (!container) return;
    container.innerHTML = '';

    journals.forEach((journal) => {
      const id = `journal-${journal.name.replace(/[^\w\u4e00-\u9fa5-]/g, '-')}`;
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <input type="checkbox" id="${id}" value="${escapeHtml(journal.name)}" checked>
        <label for="${id}">${escapeHtml(journal.name)}</label>
      `;
      container.appendChild(div);
    });
  }

  function getSelectedJournals() {
    return Array.from(document.querySelectorAll('#journal-select input[type="checkbox"]:checked'))
      .map((input) => input.value);
  }

  function parseQuery(q) {
    const query = (q || '').trim();
    if (!query) return { tokens: [], orGroups: [] };

    const rawTokens = query.match(/(?:"[^"]*"|[^\s"])+/g) || [];
    const tokens = [];
    const orGroups = [];

    rawTokens
      .map((token) => token.replace(/"/g, '').trim())
      .filter(Boolean)
      .forEach((token) => {
        if (token.includes('|')) {
          const parts = token.split('|').map((part) => part.trim()).filter(Boolean);
          if (parts.length) orGroups.push(parts);
        } else {
          tokens.push(token);
        }
      });

    return { tokens, orGroups };
  }

  function getSearchText(p, field) {
    if (field === 'title') return p.title || '';
    if (field === 'abstract') return p.abstract || '';
    if (field === 'keywords') return p.keywords || '';
    if (field === 'authors') return p.authors || '';
    return `${p.title || ''} ${p.abstract || ''} ${p.keywords || ''} ${p.authors || ''}`;
  }

  function paperMatches(p, parsed, field) {
    const text = getSearchText(p, field).toLowerCase();

    for (const token of parsed.tokens) {
      if (!text.includes(token.toLowerCase())) return false;
    }

    for (const group of parsed.orGroups) {
      let matched = false;
      for (const part of group) {
        if (text.includes(part.toLowerCase())) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }

    return true;
  }

  function shardOverlapsYears(shard, yFrom, yTo) {
    return !(yTo < shard.from || yFrom > shard.to);
  }

  async function loadShard(shard) {
    if (shardCache.has(shard.key)) return shardCache.get(shard.key);
    if (shardLoading.has(shard.key)) return shardLoading.get(shard.key);

    const promise = (async () => {
      const url = dataVersion
        ? `${shard.url}${shard.url.includes('?') ? '&' : '?'}v=${encodeURIComponent(dataVersion)}`
        : shard.url;
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`Failed to load data: ${shard.url} (HTTP ${resp.status})`);
      const data = await resp.json();
      shardCache.set(shard.key, data);
      return data;
    })();

    shardLoading.set(shard.key, promise);
    try {
      return await promise;
    } finally {
      shardLoading.delete(shard.key);
    }
  }

  async function loadNeededData(yFrom, yTo) {
    const needed = shards.filter((shard) => shardOverlapsYears(shard, yFrom, yTo));
    if (!needed.length) return [];

    setSubmitDisabled(true);
    setStatus(`Loading data shards: ${needed.map((shard) => shard.label).join(', ')} ...`);

    const arrays = await Promise.all(needed.map((shard) => loadShard(shard)));
    const all = arrays.flat();

    setSubmitDisabled(false);
    setStatus(`Loaded ${needed.length} shard(s), ${all.length.toLocaleString()} records. Filtering now.`);
    return all;
  }

  function sortResults(items, sortBy) {
    if (sortBy === 'early') {
      items.sort((a, b) => (a.year || 0) - (b.year || 0) || String(a.journal || '').localeCompare(String(b.journal || ''), 'zh-Hans-CN'));
    } else if (sortBy === 'journal') {
      items.sort((a, b) => String(a.journal || '').localeCompare(String(b.journal || ''), 'zh-Hans-CN') || (b.year || 0) - (a.year || 0));
    } else {
      items.sort((a, b) => (b.year || 0) - (a.year || 0) || String(a.journal || '').localeCompare(String(b.journal || ''), 'zh-Hans-CN'));
    }
  }

  function renderResults(results, total) {
    const container = $('results-container');
    if (!container) return;

    if (!results.length) {
      container.innerHTML = '<div class="info">No matching papers found. Try adjusting the keywords, years, or journals.</div>';
      return;
    }

    const showAbstract = $('show-abstract') ? $('show-abstract').checked : false;
    let html = `<h3>Search results (${total.toLocaleString()} papers found; showing first ${results.length.toLocaleString()})</h3>`;

    results.forEach((paper, index) => {
      const title = escapeHtml(paper.title || 'Untitled');
      const authors = escapeHtml(paper.authors || 'Author information unavailable');
      const year = escapeHtml(paper.year || '');
      const journal = escapeHtml(paper.journal || '');
      const keywords = escapeHtml(paper.keywords || '');
      const abstract = escapeHtml(paper.abstract || '');

      html += `
        <div class="result-item">
          <div class="result-title">${index + 1}. ${title}</div>
          <div class="result-meta">${authors} (${year}) - <strong>${journal}</strong></div>
          ${keywords ? `<div class="result-keywords"><strong>Keywords:</strong> ${keywords}</div>` : ''}
          ${showAbstract && abstract ? `<div class="result-abstract">${abstract}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function showLoading() {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">Searching, please wait...</div>';
  }

  function showError(message) {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = `<div class="error"><strong>Error:</strong> ${escapeHtml(message)}</div>`;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const query = ($('query') ? $('query').value : '').trim();
    const field = $('search-field') ? $('search-field').value : 'all';
    const yFrom = parseInt($('year-from') ? $('year-from').value : String(yearMin), 10);
    const yTo = parseInt($('year-to') ? $('year-to').value : String(yearMax), 10);
    const sortBy = $('sort-by') ? $('sort-by').value : 'recent';
    const maxShow = Math.min(200, Math.max(1, parseInt($('max-results') ? $('max-results').value : '50', 10)));
    const selectedJournals = new Set(getSelectedJournals());

    if (Number.isNaN(yFrom) || Number.isNaN(yTo) || yFrom > yTo) {
      showError('Invalid year range. Start year cannot be greater than end year.');
      return;
    }

    if (!selectedJournals.size) {
      showError('Please select at least one journal.');
      return;
    }

    showLoading();

    let data;
    try {
      data = await loadNeededData(yFrom, yTo);
    } catch (err) {
      setSubmitDisabled(false);
      setStatus('Failed to load data.', 'error');
      showError(err && err.message ? err.message : 'Failed to load data.');
      return;
    }

    setStatus('Filtering and searching...');

    const parsed = parseQuery(query);
    const matched = [];

    for (const paper of data) {
      const year = Number(paper.year);
      if (year < yFrom || year > yTo) continue;
      if (!selectedJournals.has(paper.journal)) continue;
      if (query && !paperMatches(paper, parsed, field)) continue;
      matched.push(paper);
    }

    sortResults(matched, sortBy);
    const shown = matched.slice(0, maxShow);

    setStatus(`Done: ${matched.length.toLocaleString()} matching paper(s).`);
    renderResults(shown, matched.length);
  }

  function bind() {
    const form = $('cnki-search-form');
    if (form) form.addEventListener('submit', handleSubmit);

    window.clearCnkiForm = () => {
      if ($('query')) $('query').value = '';
      if ($('search-field')) $('search-field').value = 'all';
      if ($('year-from')) $('year-from').value = String(yearMin);
      if ($('year-to')) $('year-to').value = String(yearMax);
      if ($('sort-by')) $('sort-by').value = 'recent';
      if ($('max-results')) $('max-results').value = '50';
      if ($('show-abstract')) $('show-abstract').checked = false;
      document.querySelectorAll('#journal-select input[type="checkbox"]').forEach((input) => {
        input.checked = true;
      });
      const results = $('results-container');
      if (results) results.innerHTML = '';
      setStatus('Ready to search.');
    };
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadManifest();
    initYears();
    initJournalsUI();
    bind();
    setStatus('Ready to search.');
  });
})();
