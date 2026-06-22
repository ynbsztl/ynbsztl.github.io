---
layout: single
title: "Chinese Economics Paper Search"
permalink: /cnki-search/
author_profile: true
---

<style>
.cnki-search-container {
  max-width: 1000px;
  margin: 0 auto;
  font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
}

.search-form {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
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
  min-width: 190px;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 26px;
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

.data-status,
.info {
  background: #d1ecf1;
  color: #0c5460;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.journal-select {
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 14px;
  font-size: 14px;
}

.journal-item {
  display: inline-flex;
  align-items: center;
  margin: 0;
  min-width: 0;
}

.journal-item input {
  margin-right: 8px;
  transform: scale(0.95);
}

.journal-item label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
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
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.45;
}

.result-meta {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.result-keywords {
  color: #555;
  font-size: 13px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.result-abstract {
  color: #555;
  line-height: 1.7;
  margin-top: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 640px) {
  .search-form {
    padding: 18px;
  }

  .btn {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>

<div class="cnki-search-container">
  <div id="data-status" class="data-status">
    <strong>Data status:</strong> <span id="status-text">Ready to search. Source: files/cnki_list.csv; 7 Chinese journals.</span>
  </div>

  <div class="search-form">
    <form id="cnki-search-form">
      <div class="form-group">
        <label for="query">Search query</label>
        <input type="text" id="query" class="form-control" placeholder="Enter keywords, authors, titles, or phrases...">
      </div>

      <div class="form-row">
        <div class="form-col">
          <label for="search-field">Search field</label>
          <select id="search-field" class="form-control">
            <option value="all">Title, abstract, keywords, and authors</option>
            <option value="title">Title</option>
            <option value="abstract">Abstract</option>
            <option value="keywords">Keywords</option>
            <option value="authors">Authors</option>
          </select>
        </div>
        <div class="form-col">
          <label for="year-from">Start year</label>
          <input type="number" id="year-from" class="form-control" value="1955" min="1955" max="2026">
        </div>
        <div class="form-col">
          <label for="year-to">End year</label>
          <input type="number" id="year-to" class="form-control" value="2026" min="1955" max="2026">
        </div>
        <div class="form-col">
          <label for="sort-by">Sort by</label>
          <select id="sort-by" class="form-control">
            <option value="recent">Most recent</option>
            <option value="early">Earliest</option>
            <option value="journal">Journal name</option>
          </select>
        </div>
        <div class="form-col">
          <label for="max-results">Maximum results</label>
          <input type="number" id="max-results" class="form-control" value="50" min="1" max="200">
        </div>
      </div>

      <div class="form-group">
        <label>Journal selection</label>
        <div class="journal-select" id="journal-select"></div>
      </div>

      <div class="form-group">
        <input type="checkbox" id="show-abstract">
        <label for="show-abstract" style="display:inline; margin-left:5px;">Show abstracts</label>
      </div>

      <button type="submit" class="btn">Search</button>
      <button type="button" class="btn btn-secondary" onclick="clearCnkiForm()">Clear form</button>
    </form>
  </div>

  <div id="results-container" class="results-container"></div>
</div>

<script src="{{ '/assets/js/cnki-search-static.js' | relative_url }}"></script>
