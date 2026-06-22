// @ts-nocheck
// Static keyword search for Econ Paper Search.
// Data is built from files/RePEc_list.csv into assets/econ-search/*.json.
(() => {
  let yearMin = 1907;
  let yearMax = 2030;
  let shards = [];
  let journals = [];
  let dataVersion = '';
  const defaultRanks = new Set([1, 2, 3]);
  const shardCache = new Map();
  const shardLoading = new Map();

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
    const t = $('status-text');
    if (!box || !t) return;
    box.className = kind === 'error' ? 'error' : 'info';
    t.textContent = text;
  }

  function setSubmitDisabled(disabled) {
    const submitBtn = document.querySelector('#search-form button[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  async function loadManifest() {
    const resp = await fetch('/assets/econ-search/manifest.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`Failed to load manifest.json (HTTP ${resp.status})`);
    const manifest = await resp.json();

    yearMin = Number(manifest.year_min || yearMin);
    yearMax = Number(manifest.year_max || yearMax);
    dataVersion = String(manifest.generated_at || manifest.source_mtime || '');

    if (Array.isArray(manifest.default_ranks)) {
      defaultRanks.clear();
      manifest.default_ranks.forEach((rank) => defaultRanks.add(Number(rank)));
    }

    journals = Array.isArray(manifest.journals) ? manifest.journals : [];
    shards = Array.isArray(manifest.shards)
      ? manifest.shards.map((shard) => ({
          key: shard.key,
          label: shard.label,
          from: shard.from == null ? -Infinity : Number(shard.from),
          to: shard.to == null ? Infinity : Number(shard.to),
          rank: Number(shard.rank),
          url: shard.url,
        }))
      : [];

    if (!journals.length || !shards.length) {
      throw new Error('Econ search manifest is missing journals or shards.');
    }
  }

  function initYears() {
    const yf = $('year-from');
    const yt = $('year-to');
    if (yf) {
      yf.min = String(yearMin);
      yf.max = String(yearMax);
      yf.value = String(Math.max(1980, yearMin));
    }
    if (yt) {
      yt.min = String(yearMin);
      yt.max = String(yearMax);
      yt.value = String(yearMax);
    }
  }

  function rankGroups() {
    const ranks = Array.from(new Set(journals.map((journal) => Number(journal.rank)).filter(Number.isFinite)));
    ranks.sort((a, b) => a - b);
    return ranks;
  }

  function journalId(abbr) {
    return `journal-${String(abbr).replace(/[^\w-]/g, '-')}`;
  }

  function initJournalsUI() {
    const container = $('journal-select');
    if (!container) return;
    container.innerHTML = '';

    const actions = document.createElement('div');
    actions.className = 'journal-item journal-item--cat';
    actions.innerHTML = `
      <input type="checkbox" id="cat-default" value="default" checked>
      <label for="cat-default">DEFAULT RANKS 1-3</label>
    `;
    container.appendChild(actions);
    const defaultCb = actions.querySelector('input');
    if (defaultCb) defaultCb.addEventListener('change', () => toggleDefaultRanks(defaultCb.checked));

    rankGroups().forEach((rank) => {
      const div = document.createElement('div');
      div.className = 'journal-item journal-item--cat';
      const checked = defaultRanks.has(rank) ? 'checked' : '';
      div.innerHTML = `
        <input type="checkbox" id="cat-rank-${rank}" value="${rank}" ${checked}>
        <label for="cat-rank-${rank}">RANK ${rank}</label>
      `;
      container.appendChild(div);
      const cb = div.querySelector('input');
      if (cb) cb.addEventListener('change', () => toggleRank(rank, cb.checked));
    });

    journals.forEach((journal) => {
      const abbr = journal.abbr || journal.journal || '';
      const rank = Number(journal.rank);
      const checked = journal.default || defaultRanks.has(rank) ? 'checked' : '';
      const title = journal.name ? `${abbr.toUpperCase()} - ${journal.name}` : abbr.toUpperCase();
      const div = document.createElement('div');
      div.className = 'journal-item journal-item--journal';
      div.dataset.rank = String(rank);
      div.innerHTML = `
        <input type="checkbox" id="${journalId(abbr)}" value="${escapeHtml(abbr)}" data-rank="${rank}" ${checked}>
        <label for="${journalId(abbr)}" title="${escapeHtml(title)}">${escapeHtml(abbr.toUpperCase())}</label>
      `;
      container.appendChild(div);
    });
  }

  function toggleDefaultRanks(checked) {
    rankGroups().forEach((rank) => {
      const shouldCheck = checked && defaultRanks.has(rank);
      const rankCb = document.getElementById(`cat-rank-${rank}`);
      if (rankCb) rankCb.checked = shouldCheck;
      toggleRank(rank, shouldCheck);
    });
  }

  function toggleRank(rank, checked) {
    document.querySelectorAll(`#journal-select input[data-rank="${rank}"]`).forEach((input) => {
      input.checked = checked;
    });
  }

  function getSelectedJournals() {
    return Array.from(document.querySelectorAll('#journal-select input[type="checkbox"][data-rank]:checked'))
      .map((input) => input.value);
  }

  function getSelectedRanks() {
    return new Set(
      Array.from(document.querySelectorAll('#journal-select input[type="checkbox"][data-rank]:checked'))
        .map((input) => Number(input.dataset.rank))
        .filter(Number.isFinite)
    );
  }

  function switchMode() {
    const keywordBtn = $('keyword-btn');
    const aiBtn = $('ai-btn');
    if (keywordBtn) keywordBtn.classList.add('active');
    if (aiBtn) aiBtn.classList.remove('active');
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

  function paperMatches(p, parsed) {
    const info = `${p.title || ''} ${p.abstract || ''}`.toLowerCase();

    for (const token of parsed.tokens) {
      if (!info.includes(token.toLowerCase())) return false;
    }

    for (const group of parsed.orGroups) {
      let any = false;
      for (const part of group) {
        if (info.includes(part.toLowerCase())) {
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

  async function loadNeededData(yFrom, yTo, selectedRanks) {
    const need = shards.filter((shard) => selectedRanks.has(shard.rank) && shardOverlapsYears(shard, yFrom, yTo));
    if (!need.length) return [];

    setStatus(`Loading ${need.length} data shard(s): ${need.map((shard) => shard.key).join(', ')} ...`);
    setSubmitDisabled(true);

    const arrays = await Promise.all(need.map((shard) => loadShard(shard)));
    const all = arrays.flat();

    setStatus(`Loaded ${all.length.toLocaleString()} records. Filtering now.`);
    setSubmitDisabled(false);
    return all;
  }

  function sortResults(items, sortBy) {
    if (sortBy === 'early') {
      items.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else {
      items.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
  }

  function renderResults(results, total) {
    const container = $('results-container');
    if (!container) return;

    if (!results.length) {
      container.innerHTML = '<div class="info">No matching papers found. Try adjusting the search criteria.</div>';
      return;
    }

    const showAbstract = $('show-abstract') ? $('show-abstract').checked : false;
    let html = `<h3>Search results (${total.toLocaleString()} papers found; showing first ${results.length.toLocaleString()})</h3>`;

    results.forEach((p, idx) => {
      const title = escapeHtml(p.title || '');
      const authors = escapeHtml(p.authors || '');
      const year = escapeHtml(p.year || '');
      const journal = escapeHtml(p.journal || '');
      const rank = escapeHtml(p.rank || '');
      const url = p.url || '';
      const abstract = escapeHtml(p.abstract || '');
      const titleHtml = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : title;

      html += `
        <div class="result-item">
          <div class="result-title">${idx + 1}. ${titleHtml}</div>
          <div class="result-meta">${authors} (${year}) - <strong>${journal}</strong>${rank ? ` · Rank ${rank}` : ''}</div>
          ${showAbstract && abstract ? `<div class="result-abstract">${abstract}</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function showError(msg) {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = `<div class="error"><strong>Error:</strong> ${escapeHtml(msg)}</div>`;
  }

  function showLoading() {
    const container = $('results-container');
    if (!container) return;
    container.innerHTML = '<div class="loading">Searching, please wait...</div>';
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();

    const query = ($('query') ? $('query').value : '').trim();
    const yFrom = parseInt($('year-from') ? $('year-from').value : String(yearMin), 10);
    const yTo = parseInt($('year-to') ? $('year-to').value : String(yearMax), 10);
    const sortBy = $('sort-by') ? $('sort-by').value : 'recent';
    const maxShow = Math.min(200, Math.max(1, parseInt($('max-results') ? $('max-results').value : '50', 10)));
    const selectedJournals = new Set(getSelectedJournals());
    const selectedRanks = getSelectedRanks();

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
      data = await loadNeededData(yFrom, yTo, selectedRanks);
    } catch (err) {
      showError(err && err.message ? err.message : 'Failed to load data.');
      setStatus('Failed to load data.', 'error');
      setSubmitDisabled(false);
      return;
    }

    setStatus('Filtering and searching. Large ranges may take a few seconds...');

    const parsed = parseQuery(query);
    const matched = [];

    for (const paper of data) {
      const y = paper.year;
      if (y < yFrom || y > yTo) continue;
      if (!selectedJournals.has(paper.journal)) continue;
      if (query && !paperMatches(paper, parsed)) continue;
      matched.push(paper);
    }

    sortResults(matched, sortBy);
    const shown = matched.slice(0, maxShow);

    setStatus(`Done: ${matched.length.toLocaleString()} matching paper(s).`);
    renderResults(shown, matched.length);
  }

  function resetForm() {
    if ($('query')) $('query').value = '';
    if ($('year-from')) $('year-from').value = String(Math.max(1980, yearMin));
    if ($('year-to')) $('year-to').value = String(yearMax);
    if ($('sort-by')) $('sort-by').value = 'recent';
    if ($('max-results')) $('max-results').value = '50';
    if ($('show-abstract')) $('show-abstract').checked = false;
    document.querySelectorAll('#journal-select input[type="checkbox"][data-rank]').forEach((input) => {
      input.checked = defaultRanks.has(Number(input.dataset.rank));
    });
    rankGroups().forEach((rank) => {
      const cb = document.getElementById(`cat-rank-${rank}`);
      if (cb) cb.checked = defaultRanks.has(rank);
    });
    const defaultCb = $('cat-default');
    if (defaultCb) defaultCb.checked = true;
    const container = $('results-container');
    if (container) container.innerHTML = '';
    setStatus('Ready to search. Rank 1-3 journals are selected by default.');
  }

  function bind() {
    const form = $('search-form');
    if (form) form.addEventListener('submit', handleSearchSubmit);
    window.switchMode = switchMode;
    window.clearForm = resetForm;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setSubmitDisabled(true);
    try {
      await loadManifest();
      initYears();
      initJournalsUI();
      bind();
      switchMode();
      setStatus('Ready to search. Rank 1-3 journals are selected by default.');
      setSubmitDisabled(false);
    } catch (err) {
      setStatus('Failed to load Econ Search metadata.', 'error');
      showError(err && err.message ? err.message : 'Failed to load Econ Search metadata.');
      setSubmitDisabled(true);
    }
  });
})();
