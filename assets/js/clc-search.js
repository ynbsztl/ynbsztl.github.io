(function () {
  'use strict';

  const app = document.getElementById('clc-app');
  if (!app) return;
  const query = document.getElementById('clc-query');
  const scope = document.getElementById('clc-scope');
  const results = document.getElementById('clc-results');
  const status = document.getElementById('clc-status');
  const retry = document.getElementById('clc-retry');
  const copyStatus = document.getElementById('clc-copy-status');
  const PAGE_SIZE = 60;
  let rows = [], children = [], roots = [], rootOf = [], searchRows = [];
  let byCode = new Map(), matches = [], shown = 0, timer, ready = false;

  // Preserve the source labels for display; ignore wrappers only when searching.
  function normalize(value) {
    return value.normalize('NFKC').toUpperCase().replace(/[\s\[\]{}]/g, '');
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function routeURL(values) {
    const url = new URL(window.location.href);
    ['q', 'scope', 'class'].forEach(key => url.searchParams.delete(key));
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url;
  }

  function nodeLink(index, className) {
    const link = element('a', className);
    link.href = routeURL({ class: index < 0 ? '' : rows[index][0], scope: index < 0 ? '' : scope.value }).href;
    link.dataset.node = String(index);
    return link;
  }

  function codeLabel(code) { return element('span', 'clc-code', code); }

  function copyButton(index) {
    const button = element('button', 'clc-copy', '复制类号');
    button.type = 'button';
    button.dataset.copy = String(index);
    button.setAttribute('aria-label', '复制分类号 ' + rows[index][0]);
    return button;
  }

  function ancestors(index) {
    const path = [];
    for (let i = rows[index][2]; i >= 0; i = rows[i][2]) path.unshift(i);
    return path;
  }

  function showBrowse(index) {
    results.replaceChildren();
    const breadcrumb = element('nav', 'clc-breadcrumb');
    breadcrumb.setAttribute('aria-label', '分类路径');
    const home = nodeLink(-1);
    home.textContent = '全部大类';
    breadcrumb.append(home);
    if (index >= 0) {
      ancestors(index).concat(index).forEach(i => {
        breadcrumb.append(element('span', '', '›'));
        const link = nodeLink(i);
        link.textContent = rows[i][0] + ' ' + rows[i][1];
        if (i === index) link.setAttribute('aria-current', 'page');
        breadcrumb.append(link);
      });
    }
    results.append(breadcrumb);

    if (index >= 0) {
      const detail = element('div', 'clc-detail');
      const title = element('h2');
      title.append(codeLabel(rows[index][0]), document.createTextNode(rows[index][1]));
      detail.append(title, copyButton(index));
      if (rows[index][0].includes('[')) detail.append(element('p', '', '[ ] 为来源标记的交替类号。'));
      results.append(detail);
    }
    const nodes = index < 0 ? roots : children[index];
    const title = element('h2', '', index < 0 ? '22 个基本大类' : '下级分类');
    results.append(title);
    if (!nodes.length) {
      results.append(element('p', 'clc-empty', '此类目在当前数据中没有下级分类。可点击上方路径查看上级及同级分类。'));
    } else {
      const grid = element('div', 'clc-grid');
      nodes.forEach(i => {
        const link = nodeLink(i, 'clc-category');
        link.append(codeLabel(rows[i][0]), element('span', '', rows[i][1]));
        grid.append(link);
      });
      results.append(grid);
    }
    status.textContent = index < 0
      ? '已载入 ' + rows.length.toLocaleString('zh-CN') + ' 个类目，选择一个大类开始浏览。'
      : rows[index][0] + ' · ' + nodes.length + ' 个直接下级类目';
  }

  function appendResults() {
    const list = document.getElementById('clc-result-list');
    const end = Math.min(shown + PAGE_SIZE, matches.length);
    const fragment = document.createDocumentFragment();
    for (let position = shown; position < end; position++) {
      const i = matches[position];
      const card = element('article', 'clc-result');
      const heading = element('div', 'clc-result-heading');
      const link = nodeLink(i, 'clc-result-title');
      link.append(codeLabel(rows[i][0]), document.createTextNode(rows[i][1]));
      heading.append(link, copyButton(i));
      card.append(heading);
      const path = ancestors(i).map(p => rows[p][0] + ' ' + rows[p][1]).join(' › ');
      card.append(element('p', 'clc-result-path', path || '基本大类'));
      fragment.append(card);
    }
    list.append(fragment);
    shown = end;
    const more = document.getElementById('clc-more');
    more.hidden = shown >= matches.length;
    more.textContent = '再显示 ' + Math.min(PAGE_SIZE, matches.length - shown) + ' 条';
    status.textContent = '找到 ' + matches.length.toLocaleString('zh-CN') + ' 个类目，已显示 ' + shown + ' 个。点击类目查看上下级分类。';
  }

  function showSearch() {
    const tokens = query.value.trim().split(/\s+/).map(normalize).filter(Boolean);
    if (!tokens.length) {
      showBrowse(scope.value ? byCode.get(scope.value) : -1);
      return;
    }
    const codeQuery = normalize(query.value);
    const ranked = [];
    searchRows.forEach((row, i) => {
      if (scope.value && rows[rootOf[i]][0] !== scope.value) return;
      if (!tokens.every(token => row.code.includes(token) || row.name.includes(token))) return;
      const rank = row.code === codeQuery ? 0 : row.code.startsWith(codeQuery) ? 1 : row.name === codeQuery ? 2 : 3;
      ranked.push({ i, rank });
    });
    ranked.sort((a, b) => a.rank - b.rank || a.i - b.i);
    matches = ranked.map(item => item.i);
    shown = 0;
    results.replaceChildren(element('h2', '', '查询结果'));
    if (!matches.length) {
      status.textContent = '没有找到匹配的类目。';
      results.append(element('p', 'clc-empty', '试试更短的关键词、分类号前缀，或将查询范围切换为“全部大类”。'));
      return;
    }
    const list = element('div', 'clc-list');
    list.id = 'clc-result-list';
    const more = element('button', 'clc-more');
    more.type = 'button';
    more.id = 'clc-more';
    more.addEventListener('click', () => {
      const firstNew = shown;
      appendResults();
      list.children[firstNew].querySelector('a').focus({ preventScroll: true });
    });
    results.append(list, more);
    appendResults();
  }

  function search() {
    clearTimeout(timer);
    if (!ready) return;
    copyStatus.textContent = '';
    history.replaceState(null, '', routeURL({ q: query.value.trim(), scope: scope.value }));
    showSearch();
  }

  function applyLocation() {
    if (!ready) return;
    clearTimeout(timer);
    const params = new URL(window.location.href).searchParams;
    query.value = params.get('q') || '';
    const rootCode = params.get('scope');
    scope.value = roots.some(i => rows[i][0] === rootCode) ? rootCode : '';
    copyStatus.textContent = '';
    const code = params.get('class');
    if (query.value.trim()) showSearch();
    else if (code && byCode.has(code)) showBrowse(byCode.get(code));
    else {
      showBrowse(scope.value ? byCode.get(scope.value) : -1);
      if (code) status.textContent = '当前数据中未找到分类号“' + code + '”，可重新搜索或浏览。';
    }
  }

  async function copyCode(index) {
    const code = rows[index][0];
    try {
      await navigator.clipboard.writeText(code);
      copyStatus.textContent = '已复制分类号：' + code;
    } catch (_) {
      // Keep copying usable on browsers without Clipboard API permissions.
      const input = element('textarea');
      input.value = code;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      const previousFocus = document.activeElement;
      input.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) { /* Show manual fallback. */ }
      input.remove();
      if (previousFocus) previousFocus.focus({ preventScroll: true });
      copyStatus.textContent = copied ? '已复制分类号：' + code : '自动复制不可用，请选中并复制分类号：' + code;
    }
  }

  app.addEventListener('click', event => {
    const copy = event.target.closest('[data-copy]');
    if (copy && ready) { copyCode(Number(copy.dataset.copy)); return; }
    const shortcut = event.target.closest('[data-query]');
    if (shortcut && ready) {
      query.value = shortcut.dataset.query;
      scope.value = '';
      search();
      return;
    }
    const link = event.target.closest('a[data-node]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null, '', link.href);
    applyLocation();
  });
  document.getElementById('clc-form').addEventListener('submit', event => { event.preventDefault(); search(); });
  query.addEventListener('input', event => {
    clearTimeout(timer);
    if (!event.isComposing) timer = setTimeout(search, 120);
  });
  query.addEventListener('compositionend', () => { clearTimeout(timer); timer = setTimeout(search, 120); });
  scope.addEventListener('change', search);
  document.getElementById('clc-clear').addEventListener('click', () => {
    query.value = '';
    scope.value = '';
    search();
    query.focus();
  });
  window.addEventListener('popstate', applyLocation);

  async function load() {
    ready = false;
    retry.hidden = true;
    results.setAttribute('aria-busy', 'true');
    status.textContent = '正在载入分类数据…';
    app.querySelectorAll('form input, form button, form select').forEach(node => { node.disabled = true; });
    try {
      const response = await fetch(app.dataset.indexUrl);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data.rows) || data.rows.length !== data.count) throw new Error('Invalid CLC index');
      rows = data.rows;
      children = rows.map(() => []);
      roots = [];
      rootOf = [];
      byCode = new Map();
      rows.forEach((row, i) => {
        const parent = row[2];
        if (!Number.isInteger(parent) || parent < -1 || parent >= i) throw new Error('Invalid parent index');
        byCode.set(row[0], i);
        if (parent < 0) { roots.push(i); rootOf[i] = i; }
        else { children[parent].push(i); rootOf[i] = rootOf[parent]; }
      });
      searchRows = rows.map(row => ({ code: normalize(row[0]), name: normalize(row[1]) }));
      scope.replaceChildren(element('option', '', '全部大类'));
      scope.firstChild.value = '';
      roots.forEach(i => {
        const option = element('option', '', rows[i][0] + ' ' + rows[i][1]);
        option.value = rows[i][0];
        scope.append(option);
      });
      document.getElementById('clc-total').textContent = data.count.toLocaleString('zh-CN');
      ready = true;
      applyLocation();
    } catch (error) {
      status.textContent = '分类数据加载失败，请检查网络后重试。';
      retry.hidden = false;
      console.error('CLC data loading failed:', error);
    } finally {
      results.setAttribute('aria-busy', 'false');
      app.querySelectorAll('form input, form button, form select').forEach(node => { node.disabled = !ready; });
    }
  }
  retry.addEventListener('click', load);
  load();
}());
