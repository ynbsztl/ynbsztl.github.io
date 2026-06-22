---
layout: single
title: "Econ Paper Search"
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
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.journal-item {
  display: inline-flex;
  align-items: center;
  margin: 0;
  width: calc(25% - 14px);
  min-width: 140px;
  white-space: nowrap;
}

.journal-item input {
  margin-right: 8px;
  transform: scale(0.95);
}

.journal-item label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.journal-item--cat label {
  font-weight: 800;
}

@media (max-width: 900px) {
  .journal-item { width: calc(33.333% - 14px); }
}
@media (max-width: 640px) {
  .journal-item { width: calc(50% - 14px); }
}
@media (max-width: 420px) {
  .journal-item { width: 100%; }
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
  <!-- <h1>Econ Paper Search</h1> -->
  
  <!-- <div class="info">
    <strong>About this tool:</strong> Search economics journal articles from RePEc with keyword search.
  </div> -->

  <div id="data-status" class="info">
    <strong>Data status:</strong> <span id="status-text">Loading metadata...</span>
  </div>

  <div class="search-form">
    <!-- <div class="search-mode-toggle">
      <button class="toggle-btn active" onclick="switchMode('keyword')" id="keyword-btn">Keyword search</button>
      <button class="toggle-btn" onclick="switchMode('ai')" id="ai-btn" disabled title="AI semantic search is not available in static-site mode">AI semantic search (unavailable)</button>
    </div> -->

    <form id="search-form">
      <div class="form-group">
        <label for="query">Search query</label>
        <input type="text" id="query" class="form-control" placeholder="Enter keywords or a query...">
      </div>

      <div class="form-row">
        <div class="form-col">
          <label for="year-from">Start year</label>
          <input type="number" id="year-from" class="form-control" value="1980" min="1900" max="2024">
        </div>
        <div class="form-col">
          <label for="year-to">End year</label>
          <input type="number" id="year-to" class="form-control" value="2024" min="1900" max="2024">
        </div>
        <div class="form-col">
          <label for="sort-by">Sort by</label>
          <select id="sort-by" class="form-control">
            <option value="recent">Most recent</option>
            <option value="early">Earliest</option>
            <option value="similarity" style="display:none;">Similarity</option>
          </select>
        </div>
        <div class="form-col">
          <label for="max-results">Maximum results</label>
          <input type="number" id="max-results" class="form-control" value="50" min="1" max="200">
        </div>
      </div>

      <div class="form-group" id="similarity-group" style="display:none;"></div>

      <div class="form-group">
        <label>Journal selection</label>
        <div class="journal-select" id="journal-select">
          <!-- Journal options are generated by JavaScript -->
        </div>
      </div>

      <div class="form-group">
        <input type="checkbox" id="show-abstract"> 
        <label for="show-abstract" style="display:inline; margin-left:5px;">Show abstracts</label>
      </div>

      <button type="submit" class="btn">Search</button>
      <button type="button" class="btn btn-secondary" onclick="clearForm()">Clear form</button>
    </form>
  </div>

  <div id="results-container" class="results-container"></div>

  <!-- <div class="help-section">
    <h3>Help</h3>
    <div id="keyword-help">
      <h4>Keyword Search</h4>
      <ul>
        <li>Search finds papers whose title and abstract contain <strong>all keywords</strong> separated by spaces.</li>
        <li>Search is case-insensitive and supports partial matches.</li>
        <li>Use double quotes to search for an <strong>exact phrase</strong>.</li>
        <li>Use | to match <strong>any keyword</strong>, such as labor|employment.</li>
        <li>Leave the query blank to return all papers from the selected journals.</li>
      </ul>
    </div>
    <div id="ai-help" style="display:none;">
      <h4>AI Semantic Search</h4>
      <ul>
        <li>Use a <strong>natural-language query</strong> to find semantically related papers.</li>
        <li><strong>Complete phrases and sentences</strong> work better than single keywords.</li>
        <li><strong>Word order matters</strong>; the same words can mean different things in different contexts.</li>
        <li>Example: "minimum wage impact on employment in asian countries"</li>
        <li>The <strong>similarity threshold</strong> filters results; 0.5 is a useful rule of thumb.</li>
      </ul>
    </div>
  </div> -->
</div>

<script src="{{ '/assets/js/econ-search-static.js' | relative_url }}"></script>
