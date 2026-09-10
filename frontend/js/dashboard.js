/**
 * dashboard.js — Loads stats, charts, and verification history.
 */

document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
  // Try stats endpoint first
  try {
    const res = await window.OfferShieldAPI.dashboard.getStats();
    if (res.success) {
      applyStats(res.stats || {});
      applyCharts(res.stats || {});
      applyHistory(res.recent || []);
      return;
    }
  } catch (_) {}

  // Fallback: load from verifications list
  try {
    const vRes = await window.OfferShieldAPI.verifications.getAll();
    if (vRes.success && vRes.verifications) {
      const v = vRes.verifications;
      const stats = {
        total: v.length,
        low:                v.filter(x => x.riskLevel === 'low').length,
        needs_verification: v.filter(x => x.riskLevel === 'needs_verification').length,
        high:               v.filter(x => x.riskLevel === 'high').length,
        very_high:          v.filter(x => x.riskLevel === 'very_high').length,
      };
      applyStats(stats);
      applyCharts(stats);
      applyHistory(v.map(x => ({
        id: x._id,
        company: x.offerSummary ? x.offerSummary.companyName : 'Unknown',
        role:    x.offerSummary ? x.offerSummary.jobTitle    : 'Unknown',
        riskScore: x.riskScore,
        riskLevel: x.riskLevel,
        riskLabel: x.riskLabel || x.riskLevel,
        date: x.createdAt,
      })));
    }
  } catch (_) {}
}

function applyStats(s) {
  setText('statTotal', s.total  || 0);
  setText('statLow',   s.low    || 0);
  setText('statNeeds', s.needs_verification || 0);
  setText('statHigh',  s.high   || 0);
  setText('statVH',    s.very_high || 0);
}

function applyCharts(s) {
  const total = Math.max(s.total || 0, 1);
  setBar('barLow',   'bvLow',   s.low    || 0, total);
  setBar('barNeeds', 'bvNeeds', s.needs_verification || 0, total);
  setBar('barHigh',  'bvHigh',  s.high   || 0, total);
  setBar('barVH',    'bvVH',    s.very_high || 0, total);
}

function setBar(fillId, valId, count, total) {
  const fill = document.getElementById(fillId);
  const val  = document.getElementById(valId);
  const pct  = total > 0 ? Math.round((count / total) * 100) : 0;
  if (fill) setTimeout(() => { fill.style.width = pct + '%'; }, 150);
  if (val)  val.textContent = count;
}

function applyHistory(items) {
  const tbody = document.getElementById('historyTbody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="tbl-empty">
          <span class="tbl-empty-icon">📋</span>
          No verifications yet. <a href="verify.html">Verify your first offer</a> to see results here.
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(v => {
    const lvl = v.riskLevel || 'needs_verification';
    const scoreColor = { very_high:'var(--red)', high:'var(--orange)', needs_verification:'var(--yellow)', low:'var(--green)' }[lvl] || 'var(--text-muted)';
    const badge = {
      low: '<span class="badge badge-low">Low Risk</span>',
      needs_verification: '<span class="badge badge-needs">Needs Verification</span>',
      high: '<span class="badge badge-high">High Risk</span>',
      very_high: '<span class="badge badge-very-high">Very High Risk</span>',
    }[lvl] || '';
    return `
      <tr>
        <td><strong>${esc(v.company)}</strong></td>
        <td class="hide-mobile" style="color:var(--text-muted); font-size:.82rem;">${esc(v.role)}</td>
        <td><strong style="color:${scoreColor};">${v.riskScore ?? '—'}</strong></td>
        <td>${badge}</td>
        <td class="hide-mobile" style="color:var(--text-muted); font-size:.8rem;">${window.formatDate ? window.formatDate(v.date) : '—'}</td>
        <td><button class="btn btn-outline btn-sm" onclick="viewReport('${v.id}')">View</button></td>
      </tr>`;
  }).join('');
}

async function viewReport(id) {
  try {
    const res = await window.OfferShieldAPI.verifications.getById(id);
    if (res.success && res.verification) {
      const overlay = document.createElement('div');
      overlay.className = 'report-overlay';
      overlay.innerHTML = `
        <div class="report-overlay-inner">
          <button class="report-overlay-close" onclick="this.closest('.report-overlay').remove()">✕</button>
          <div id="overlayReport"></div>
        </div>`;
      document.body.appendChild(overlay);
      window.setCurrentReport(res.verification);
      window.renderReport({ result: res.verification }, 'overlayReport');
    }
  } catch (err) {
    alert('Could not load report: ' + err.message);
  }
}

function esc(str) {
  if (!str || str === 'Not identified' || str === 'Unknown') return '<span style="color:var(--text-muted);">—</span>';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

window.viewReport    = viewReport;
window.loadDashboard = loadDashboard;
