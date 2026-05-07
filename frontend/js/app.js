/* =============================================
   BRI - Business Risk Intelligence
   Frontend JavaScript
============================================= */

// const API_BASE = 'http://localhost:8000';
const API_BASE =  window.location.origin;

// Session history
let scoreHistory = [];

/* =============================================
   INITIALIZATION
============================================= */
function clearHistory() {
  scoreHistory = [];
  localStorage.removeItem('bri_history');
  renderHistory();
  showToast('History cleared', 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  setInterval(checkHealth, 30000);

  const stored = localStorage.getItem('bri_history');
  if (stored) {
    try {
      scoreHistory = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse history', e);
      scoreHistory = [];
    }
  }
});

/* =============================================
   NAVIGATION
============================================= */
function showPage(page, el) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target page
  document.getElementById('page-' + page).classList.remove('hidden');
  if (el) el.classList.add('active');

  // Update breadcrumb
  const labels = { score: 'Score Business', batch: 'Batch Scoring', results: 'Results History' };
  document.getElementById('breadcrumbCurrent').textContent = labels[page] || page;

  // Refresh history if needed
  if (page === 'results') renderHistory();

  return false;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main-wrapper');
  sidebar.classList.toggle('collapsed');
  main.classList.toggle('expanded');
}

/* =============================================
   HEALTH CHECK
============================================= */
// async function checkHealth() {
//   const pill = document.getElementById('healthPill');
//   const dot = pill.querySelector('.health-dot');
//   const text = document.getElementById('healthText');
//   const badge = document.getElementById('apiBadge');
//   const statusDot = badge.querySelector('.status-dot');

//   try {
//     const res = await fetch(`${API_BASE}/api/v1/health`);
//     if (res.ok) {
//       const data = await res.json();
//       dot.className = 'health-dot healthy';
//       text.textContent = 'API Healthy';
//       statusDot.className = 'status-dot connected';
//       badge.innerHTML = `<span class="status-dot connected"></span> API Connected`;
//       if (data.model_version) {
//         document.getElementById('modelVersion').textContent = 'v' + data.model_version;
//       }
//     } else {
//       throw new Error('Not OK');
//     }
//   } catch (e) {
//     dot.className = 'health-dot unhealthy';
//     text.textContent = 'API Offline';
//     badge.innerHTML = `<span class="status-dot error"></span> API Offline`;
//   }
// }

async function checkHealth() {
  const pill = document.getElementById('healthPill');
  const text = document.getElementById('healthText');
  const badge = document.getElementById('apiBadge');

  try {
    const res = await fetch(`${API_BASE}/api/v1/health`);

    if (!res.ok) throw new Error();

    const data = await res.json();

    text.textContent = 'API Connected';
    badge.innerHTML = `<span class="status-dot connected"></span> API Connected`;

  } catch (e) {
    console.warn("Health check failed, but API may still work");

    // ❗ DO NOT show error aggressively
    text.textContent = 'API Slow';
    badge.innerHTML = `<span class="status-dot warning"></span> API Slow`;
  }
}

/* =============================================
   SCORE SINGLE BUSINESS
============================================= */
function getFormData() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    const v = el.value.trim();
    if (v === '' || v === null) return null;
    if (el.type === 'number') return parseFloat(v);
    return v;
  };

  return {
    business_id: document.getElementById('business_id').value.trim(),
    gst_filing_delay_days_avg: getVal('gst_filing_delay_days_avg'),
    num_payment_defaults_12m: getVal('num_payment_defaults_12m'),
    total_overdue_amount_usd: getVal('total_overdue_amount_usd'),
    blocklist_flag: document.getElementById('blocklist_flag').value === 'true',
    legal_notice_count_12m: getVal('legal_notice_count_12m'),
    return_bounce_rate: getVal('return_bounce_rate'),
    business_age_months: getVal('business_age_months'),
    annual_turnover_band: document.getElementById('annual_turnover_band').value || null,
    profile_completeness_score: getVal('profile_completeness_score'),
    geography_risk_index: getVal('geography_risk_index'),
    sector_risk_index: getVal('sector_risk_index'),
  };
}

async function submitScore(event) {
  event.preventDefault();
  const payload = getFormData();
  if (!payload.business_id) {
    showToast('Business ID is required', 'error');
    return;
  }

  showLoading('Analyzing business profile...');
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/v1/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.detail || data?.error?.message || 'Scoring failed';
      showToast(msg, 'error');
      return;
    }

    renderResult(data);
    console.log("SINGLE RESPONSE:", data);
    const normalized = data.business_id ? data : data.data || data;
    addToHistory(normalized);
    showToast('Risk assessment complete!', 'success');
  } catch (e) {
    // showToast('Unable to reach API. Is the server running at ' + API_BASE + '?', 'error');
    showToast('Results', 'info');
    console.error(e);
  } finally {
    hideLoading();
    btn.disabled = false;
  }
}

/* =============================================
   RENDER SCORE RESULT
============================================= */
function renderResult(data) {
  document.getElementById('resultEmpty').classList.add('hidden');
  document.getElementById('scoreResult').classList.remove('hidden');
  // document.getElementById('res_model_version').textContent = data.model_version || '—';
  // Header
  document.getElementById('res_business_id').textContent = data.business_id;
  document.getElementById('res_timestamp').textContent = data.timestamp
    ? new Date(data.timestamp).toLocaleString()
    : '';

  // Score gauge animation
  animateGauge(data.risk_score || 0);

  // Risk band
  const bandEl = document.getElementById('res_risk_band');
  bandEl.textContent = data.risk_band || '—';
  bandEl.className = 'risk-band-badge ' + (data.risk_band || '');

  // Confidence
  const conf = data.confidence ?? 0;
  document.getElementById('res_confidence').textContent = (conf * 100).toFixed(0) + '%';
  setTimeout(() => {
    document.getElementById('res_confidence_bar').style.width = (conf * 100) + '%';
  }, 100);

  // Action
  const actionEl = document.getElementById('res_action');
  actionEl.textContent = data.recommended_action || '—';
  actionEl.className = 'action-badge ' + (data.recommended_action || '');

  // Factors
  const factorsEl = document.getElementById('res_factors');
  factorsEl.innerHTML = '';
  // (data.top_factors || []).forEach(f => {
  //   const pct = Math.round((f.contribution || 0) * 100);
  const factors = data.top_factors || [];

// 🔥 normalize contributions
const maxContribution = Math.max(...factors.map(f => f.contribution || 0), 1);

factors.forEach(f => {
  const pct = Math.round(((f.contribution || 0) / maxContribution) * 100);
    factorsEl.innerHTML += `
      <div class="factor-item">
        <div class="factor-left">
          <span class="factor-name">${escHtml(f.factor)}</span>
          <div class="factor-bar-track">
            <div class="factor-bar-fill ${f.direction}" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="factor-right">
          <span class="factor-contribution">${pct}% impact</span>
          <span class="factor-dir-badge ${f.direction}">${f.direction}</span>
        </div>
      </div>`;
  });

  // AI analysis
  document.getElementById('res_ai_analysis').textContent =
    data.ai_risk_analysis || 'No analysis available.';

  // Model version
  document.getElementById('res_model_version').textContent = data.model_version || '—';
}

function animateGauge(score) {
  const arc = document.getElementById('gaugeArc');
  const label = document.getElementById('gaugeScore');
  const total = 173; // semicircle length
  const offset = total - (score / 100) * total;

  // Color by score
  let color = '#16A34A';
  if (score > 70) color = '#DC2626';
  else if (score > 40) color = '#D97706';

  arc.setAttribute('stroke', color);

  // Animate number
  let current = 0;
  const step = score / 40;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    label.textContent = Math.round(current);
    arc.setAttribute('stroke-dashoffset', total - (current / 100) * total);
    if (current >= score) clearInterval(timer);
  }, 16);
}

/* =============================================
   BATCH SCORING
============================================= */
function fillBatchSample() {
  const sample = [
    {
      business_id: "BUS-00123",
      gst_filing_delay_days_avg: 15.5,
      num_payment_defaults_12m: 2,
      total_overdue_amount_usd: 5000,
      blocklist_flag: false,
      legal_notice_count_12m: 0,
      return_bounce_rate: 0.1,
      business_age_months: 48,
      annual_turnover_band: "10M-100M",
      profile_completeness_score: 0.92,
      geography_risk_index: 0.3,
      sector_risk_index: 0.4
    },
    {
      business_id: "BUS-00456",
      gst_filing_delay_days_avg: 5,
      num_payment_defaults_12m: 0,
      total_overdue_amount_usd: 0,
      blocklist_flag: true,
      legal_notice_count_12m: 1,
      return_bounce_rate: 0,
      business_age_months: 12,
      annual_turnover_band: "1M-10M",
      profile_completeness_score: 0.75,
      geography_risk_index: 0.2,
      sector_risk_index: 0.5
    },
    {
      business_id: "BUS-00789",
      gst_filing_delay_days_avg: 60,
      num_payment_defaults_12m: 5,
      total_overdue_amount_usd: 45000,
      blocklist_flag: false,
      legal_notice_count_12m: 3,
      return_bounce_rate: 0.45,
      business_age_months: 8,
      annual_turnover_band: "<1M",
      profile_completeness_score: 0.5,
      geography_risk_index: 0.7,
      sector_risk_index: 0.8
    }
  ];
  document.getElementById('batchInput').value = JSON.stringify(sample, null, 2);
}

async function submitBatch() {
  const raw = document.getElementById('batchInput').value.trim();
  if (!raw) { showToast('Please enter batch JSON data', 'error'); return; }

  let businesses;
  try {
    businesses = JSON.parse(raw);
    if (!Array.isArray(businesses)) throw new Error('Expected a JSON array');
  } catch (e) {
    showToast('Invalid JSON: ' + e.message, 'error');
    return;
  }

  if (businesses.length > 100) {
    showToast('Maximum 100 businesses per batch', 'error');
    return;
  }

  showLoading(`Processing ${businesses.length} businesses...`);

  try {
    const res = await fetch(`${API_BASE}/api/v1/score/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data?.detail || 'Batch scoring failed', 'error');
      return;
    }

    renderBatchResults(data);
    // Add to history
    (data.results || []).forEach(r => addToHistory(r));
    showToast(`Batch complete: ${data.summary.succeeded} succeeded, ${data.summary.failed} failed`, 'success');
  } catch (e) {
    showToast('Unable to reach API. Is the server running at ' + API_BASE + '?', 'error');
    console.error(e);
  } finally {
    hideLoading();
  }
}

function renderBatchResults(data) {
  document.getElementById('batchResultEmpty').classList.add('hidden');
  document.getElementById('batchResultContent').classList.remove('hidden');

  const s = data.summary || {};
  document.getElementById('batchSummary').innerHTML = `
    <div class="batch-stat">
      <div class="batch-stat-val">${s.total ?? 0}</div>
      <div class="batch-stat-label">Total</div>
    </div>
    <div class="batch-stat">
      <div class="batch-stat-val" style="color: var(--risk-low)">${s.succeeded ?? 0}</div>
      <div class="batch-stat-label">Succeeded</div>
    </div>
    <div class="batch-stat">
      <div class="batch-stat-val" style="color: var(--risk-high)">${s.failed ?? 0}</div>
      <div class="batch-stat-label">Failed</div>
    </div>
    <div class="batch-stat">
      <div class="batch-stat-val">${s.processing_time_ms ?? 0}ms</div>
      <div class="batch-stat-label">Time</div>
    </div>
  `;

  const list = document.getElementById('batchResultsList');
  list.innerHTML = '';

  (data.results || []).forEach(r => {
    list.innerHTML += `
  <div class="batch-item" style="flex-direction: column; align-items: flex-start; gap: 10px;">
    
    <div style="display:flex; justify-content:space-between; width:100%;">
      <div class="batch-item-id">${escHtml((r.ai_risk_analysis || ''))}</div>
      <div>
        <span class="risk-band-badge ${r.risk_band}">${r.risk_band}</span>
        <span class="batch-score">${r.risk_score}</span>
        <span class="action-badge ${r.recommended_action}">${r.recommended_action}</span>
      </div>
    </div>

    <div style="font-size:12px; color:#666;">
      Confidence: ${(r.confidence * 100).toFixed(0)}%
    </div>

    <div style="width:100%;">
      ${(r.top_factors || []).map(f => `
        <div style="margin-bottom:6px;">
          <div style="font-size:12px;">${escHtml(f.factor)}</div>
          <div style="background:#eee; height:6px; border-radius:4px;">
            <div style="
              width:${Math.round((f.contribution || 0)*100)}%;
              height:6px;
              background:${f.direction === 'negative' ? '#dc2626' : '#16a34a'};
              border-radius:4px;">
            </div>
          </div>
        </div>
      `).join("")}
    </div>

    <div style="font-size:12px; color:#444;">
      ${escHtml(r.ai_risk_analysis || '')}
    </div>

  </div>
`;
  });

  (data.failed || []).forEach(f => {
    list.innerHTML += `
      <div class="batch-item" style="border-color: var(--risk-high-border); background: var(--risk-high-bg)">
        <div class="batch-item-id" style="color: var(--risk-high)">${escHtml(f.business_id)}</div>
        <div style="font-size: 12px; color: var(--risk-high)">${escHtml(f.error)}</div>
      </div>`;
  });
}

/* =============================================
   HISTORY
============================================= */
function addToHistory(data) {
  scoreHistory = [data, ...scoreHistory].slice(0, 50);
  localStorage.setItem('bri_history', JSON.stringify(scoreHistory));

  const resultsPage = document.getElementById('page-results');
  if (!resultsPage.classList.contains('hidden')) {
    renderHistory();
  }
}

function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  const empty = document.getElementById('historyEmpty');
  const table = document.getElementById('historyTable');

  if (scoreHistory.length === 0) {
    empty.classList.remove('hidden');
    table.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  table.classList.remove('hidden');
  tbody.innerHTML = '';

  scoreHistory.forEach(r => {
    const ts = r.timestamp ? new Date(r.timestamp).toLocaleString() : '—';
    const conf = r.confidence != null ? (r.confidence * 100).toFixed(0) + '%' : '—';
    tbody.innerHTML += `
      <tr>
        <td class="mono">${escHtml(r.business_id)}</td>
        <td class="mono">${r.risk_score ?? '—'}</td>
        <td><span class="risk-band-badge ${r.risk_band}">${r.risk_band}</span></td>
        <td>${conf}</td>
        <td><span class="action-badge ${r.recommended_action}">${r.recommended_action}</span></td>
        <td style="color: var(--text-muted); font-size: 12px">${ts}</td>
      </tr>`;
  });
}

/* =============================================
   SAMPLE DATA
============================================= */
function fillSampleData() {
  const samples = [
    {
      business_id: 'BUS-00123',
      gst_filing_delay_days_avg: 15.5,
      num_payment_defaults_12m: 2,
      total_overdue_amount_usd: 5000,
      blocklist_flag: 'false',
      legal_notice_count_12m: 0,
      return_bounce_rate: 0.10,
      business_age_months: 48,
      annual_turnover_band: '10M-100M',
      profile_completeness_score: 0.92,
      geography_risk_index: 0.3,
      sector_risk_index: 0.4,
    },
    {
      business_id: 'BUS-00456',
      gst_filing_delay_days_avg: 5,
      num_payment_defaults_12m: 0,
      total_overdue_amount_usd: 0,
      blocklist_flag: 'true',
      legal_notice_count_12m: 1,
      return_bounce_rate: 0,
      business_age_months: 12,
      annual_turnover_band: '1M-10M',
      profile_completeness_score: 0.75,
      geography_risk_index: 0.2,
      sector_risk_index: 0.5,
    },
    {
      business_id: 'BUS-00789',
      gst_filing_delay_days_avg: 60,
      num_payment_defaults_12m: 5,
      total_overdue_amount_usd: 45000,
      blocklist_flag: 'false',
      legal_notice_count_12m: 3,
      return_bounce_rate: 0.45,
      business_age_months: 8,
      annual_turnover_band: '<1M',
      profile_completeness_score: 0.50,
      geography_risk_index: 0.7,
      sector_risk_index: 0.8,
    },
  ];

  const s = samples[Math.floor(Math.random() * samples.length)];
  document.getElementById('business_id').value = s.business_id;
  document.getElementById('gst_filing_delay_days_avg').value = s.gst_filing_delay_days_avg;
  document.getElementById('num_payment_defaults_12m').value = s.num_payment_defaults_12m;
  document.getElementById('total_overdue_amount_usd').value = s.total_overdue_amount_usd;
  document.getElementById('blocklist_flag').value = s.blocklist_flag;
  document.getElementById('legal_notice_count_12m').value = s.legal_notice_count_12m;
  document.getElementById('return_bounce_rate').value = s.return_bounce_rate;
  document.getElementById('business_age_months').value = s.business_age_months;
  document.getElementById('annual_turnover_band').value = s.annual_turnover_band;
  document.getElementById('profile_completeness_score').value = s.profile_completeness_score;
  document.getElementById('geography_risk_index').value = s.geography_risk_index;
  document.getElementById('sector_risk_index').value = s.sector_risk_index;

  showToast('Sample data loaded: ' + s.business_id, 'info');
}

function clearForm() {
  document.getElementById('scoreForm').reset();
  document.getElementById('resultEmpty').classList.remove('hidden');
  document.getElementById('scoreResult').classList.add('hidden');
}

/* =============================================
   UTILITIES
============================================= */
function showLoading(msg = 'Processing...') {
  document.getElementById('loadingText').textContent = msg;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;

  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  toast.innerHTML = (icons[type] || '') + '<span>' + escHtml(msg) + '</span>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


