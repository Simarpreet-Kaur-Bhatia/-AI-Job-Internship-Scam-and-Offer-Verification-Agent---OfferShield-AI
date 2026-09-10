/**
 * report.js — Renders the full verification report and handles download.
 */

/* ── Helpers ────────────────────────────────────────── */
function esc(str) {
  if (!str) return '—';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function riskClass(level) {
  return { low:'low', needs_verification:'needs', high:'high', very_high:'very-high' }[level] || 'needs';
}

function badgeClass(level) {
  return { low:'badge-low', needs_verification:'badge-needs', high:'badge-high', very_high:'badge-very-high' }[level] || 'badge-needs';
}

function sevIcon(sev) {
  return { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' }[sev] || '⚪';
}

function riskColor(rc) {
  return { low:'var(--green)', needs:'var(--yellow)', high:'var(--orange)', 'very-high':'var(--red)' }[rc] || 'var(--yellow)';
}

/* ── Main render ────────────────────────────────────── */
function renderReport(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const r        = data.result || data;
  const rc       = riskClass(r.riskLevel);
  const summary  = r.offerSummary     || {};
  const evidence = r.extractedEvidence || {};
  const company  = r.companyAnalysis   || {};
  const inds     = r.riskIndicators    || [];
  const consist  = r.consistencyIssues || [];
  const recs     = r.recommendations   || [];
  const trail    = r.verificationTrail || [];
  const breakdown= r.scoreBreakdown    || [];
  const color    = riskColor(rc);

  el.innerHTML = `
    <div style="background:transparent; padding:0; min-height:auto;">

      <!-- Action bar -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="label-tag">Offer Verification Report</div>
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--navy); margin-top:.2rem;">Verification Complete</h2>
        </div>
        <div style="display:flex; gap:.6rem; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="window.print()">🖨 Print</button>
          <button class="btn btn-outline btn-sm" onclick="downloadReport()">⬇ Download</button>
          <button class="btn btn-primary btn-sm" onclick="resetVerification()">+ Verify Another</button>
        </div>
      </div>

      <!-- Risk Banner -->
      <div class="risk-banner risk-banner-${rc}" style="margin-bottom:1.25rem;">
        <div style="flex-shrink:0; text-align:center; min-width:130px;">
          <div class="rbn-score-label">Risk Assessment Score</div>
          <div class="rbn-score risk-${rc}">${r.riskScore}<span style="font-size:1.5rem;font-weight:400;opacity:.55;">/100</span></div>
          <div class="rbn-level risk-${rc}">${esc(r.riskLabel)}</div>
        </div>
        <div style="flex:1;">
          <div class="rbn-bar-track">
            <div class="rbn-bar-fill risk-${rc}" id="rbnBar" style="width:0%;"></div>
          </div>
          <div class="rbn-desc">
            ${r.riskScore >= 80
              ? 'Multiple high-risk indicators were detected. Independent verification is strongly recommended before taking any action.'
              : r.riskScore >= 60
              ? 'Several warning indicators were detected. Careful independent verification is recommended before proceeding.'
              : r.riskScore >= 30
              ? 'Some indicators require further verification. Review below and independently confirm key details.'
              : 'Low risk indicators detected. Standard due diligence is still recommended before accepting any offer.'}
          </div>
          <div class="rbn-disclaimer">OfferShield AI provides automated analysis. This is not a legal determination. Always verify independently.</div>
        </div>
      </div>

      <!-- Offer Summary -->
      <div class="report-section">
        <div class="report-section-title">📋 Offer Summary</div>
        <table class="info-table">
          <tr><td class="ik">Company</td><td class="iv">${esc(summary.companyName)}</td></tr>
          <tr><td class="ik">Role / Position</td><td class="iv">${esc(summary.jobTitle)}</td></tr>
          <tr><td class="ik">Recruiter</td><td class="iv">${esc(summary.recruiterName)}</td></tr>
          <tr><td class="ik">Recruiter Email</td><td class="iv">${esc(summary.recruiterEmail)}</td></tr>
          <tr><td class="ik">Phone</td><td class="iv">${esc(summary.recruiterPhone)}</td></tr>
          <tr><td class="ik">Salary / Stipend</td><td class="iv">${esc(summary.salary)}</td></tr>
          <tr><td class="ik">Location</td><td class="iv">${esc(summary.location)}</td></tr>
          <tr><td class="ik">Source</td><td class="iv">${esc(summary.source)}</td></tr>
          ${summary.urls && summary.urls.length ? `<tr><td class="ik">URLs Found</td><td class="iv">${summary.urls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" style="word-break:break-all;font-size:.8rem;">${esc(u)}</a>`).join('<br>')}</td></tr>` : ''}
        </table>
      </div>

      <!-- Overview cards -->
      <div class="report-section">
        <div class="report-section-title">🔍 Verification Overview</div>
        <div class="ov-grid">
          ${ovCard('Company Info',       company.status==='warning'?'ov-bad':'ov-warn', company.status==='warning'?'⚠':'!', company.status==='warning'?'Warning':'Needs Verification')}
          ${ovCard('Email Domain',       company.isFreeEmail?'ov-bad':company.domainMatch?'ov-ok':'ov-warn', company.isFreeEmail?'⚠':company.domainMatch?'✓':'!', company.isFreeEmail?'Free Email Provider':company.domainMatch?'Consistent':'Needs Verification')}
          ${ovCard('Payment Request',    evidence.paymentMentions&&evidence.paymentMentions.length?'ov-bad':'ov-ok', evidence.paymentMentions&&evidence.paymentMentions.length?'🔴':'✓', evidence.paymentMentions&&evidence.paymentMentions.length?'Detected':'None Detected')}
          ${ovCard('Urgency Language',   evidence.urgencyPhrases&&evidence.urgencyPhrases.length?'ov-warn':'ov-ok', evidence.urgencyPhrases&&evidence.urgencyPhrases.length?'!':'✓', evidence.urgencyPhrases&&evidence.urgencyPhrases.length?'Detected':'None Detected')}
          ${ovCard('Consistency',        consist.length>0?'ov-warn':'ov-ok', consist.length>0?'!':'✓', consist.length>0?`${consist.length} Issue(s)`:'No Issues')}
          ${ovCard('Risk Indicators',    inds.length>0?(inds.length>=3?'ov-bad':'ov-warn'):'ov-ok', inds.length>0?'⚠':'✓', `${inds.length} Found`)}
        </div>
      </div>

      <!-- Company Analysis -->
      <div class="report-section">
        <div class="report-section-title">🏢 Company Analysis</div>
        <table class="info-table">
          <tr><td class="ik">Identified Company</td><td class="iv">${esc(company.companyName)}</td></tr>
          <tr><td class="ik">Email Domain</td><td class="iv">${esc(company.emailDomain)}</td></tr>
          <tr><td class="ik">Free Email Provider</td><td class="iv">${company.isFreeEmail?'<span style="color:var(--orange);">Yes — personal email provider detected</span>':'<span style="color:var(--green);">No</span>'}</td></tr>
          <tr><td class="ik">Domain From URL</td><td class="iv">${esc(company.identifiedDomain)}</td></tr>
          <tr><td class="ik">Domain Consistency</td><td class="iv">${company.domainMatch===true?'<span style="color:var(--green);">Appears consistent</span>':company.domainMatch===false?'<span style="color:var(--orange);">Inconsistency detected</span>':'<span style="color:var(--text-muted);">Could not independently determine</span>'}</td></tr>
        </table>
        ${company.notes&&company.notes.length?`<div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.875rem;">${company.notes.map(n=>`<div style="font-size:.83rem;color:var(--text-muted);padding:.5rem .75rem;background:var(--surface);border-radius:var(--r-sm);border-left:3px solid var(--border-strong);">${esc(n)}</div>`).join('')}</div>`:''}
      </div>

      <!-- Warning Indicators -->
      ${inds.length ? `
      <div class="report-section">
        <div class="report-section-title">⚠️ Detected Warning Indicators (${inds.length})</div>
        ${inds.map((ind, idx) => `
          <div class="ind-card sev-${ind.severity} ${idx===0?'open':''}">
            <div class="ind-header">
              <div class="ind-title">
                ${sevIcon(ind.severity)} ${esc(ind.indicator)}
                <span class="badge ${badgeClass(ind.severity==='critical'?'very_high':ind.severity==='high'?'high':ind.severity==='medium'?'needs_verification':'low')}" style="margin-left:.4rem; font-size:.65rem;">${ind.severity.toUpperCase()}</span>
              </div>
              <span class="ind-chevron">▼</span>
            </div>
            <div class="ind-body">
              ${ind.evidence?`<div style="font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem;margin-top:.75rem;">Evidence</div><div class="ind-evidence">"${esc(ind.evidence)}"</div>`:''}
              <div style="font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem;">Why It Matters</div>
              <p style="font-size:.85rem;color:var(--text-muted);">${esc(ind.whyItMatters)}</p>
              <div style="margin-top:.75rem;padding:.5rem .75rem;background:var(--blue-bg);border-radius:var(--r-sm);font-size:.78rem;color:var(--blue);"><strong>Score contribution:</strong> +${ind.scoreContribution} points</div>
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Consistency Issues -->
      ${consist.length ? `
      <div class="report-section">
        <div class="report-section-title">🔄 Consistency Analysis</div>
        <div style="display:flex;flex-direction:column;gap:.75rem;">
          ${consist.map(ci=>`
            <div style="border-left:4px solid var(--${ci.severity==='high'?'orange':ci.severity==='medium'?'yellow':'green'});padding:.8rem 1rem;background:var(--surface);border-radius:0 var(--r-lg) var(--r-lg) 0;">
              <div style="font-size:.875rem;font-weight:700;color:var(--text);">${esc(ci.field)}</div>
              <div style="font-size:.83rem;color:var(--text-muted);margin-top:.2rem;">${esc(ci.issue)}</div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Score Breakdown -->
      <div class="report-section">
        <div class="report-section-title">📊 Risk Score Breakdown</div>
        ${breakdown.map(b=>`
          <div class="score-row">
            <span class="score-ind">${esc(b.indicator)}</span>
            <span class="score-pts">+${b.contribution}</span>
          </div>`).join('')}
        <div class="score-row" style="font-weight:800;border-top:2px solid var(--border);margin-top:.5rem;padding-top:.75rem;">
          <span class="score-ind" style="color:var(--text);">Total Risk Assessment Score</span>
          <span class="score-pts" style="font-size:1.05rem;">${r.riskScore}/100</span>
        </div>
      </div>

      <!-- Verification Trail -->
      <div class="report-section">
        <div class="report-section-title">🗺 Verification Trail</div>
        <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:1.5rem;">Click any step to see the detailed reasoning for that analysis stage.</p>
        <div>
          ${trail.map((step, idx) => `
            <div class="trail-step">
              <div class="trail-line-col">
                <div class="trail-dot trail-dot-${step.status==='warning'||step.status==='error'?step.status:'completed'}">${step.step}</div>
                ${idx < trail.length-1 ? '<div class="trail-connector"></div>' : ''}
              </div>
              <div class="trail-content">
                <div class="trail-title">
                  ${step.status==='warning'?'⚠':'✓'} ${esc(step.title)}
                  <span class="trail-expand-hint">(click to expand)</span>
                </div>
                <div class="trail-detail">
                  ${renderTrailDetail(step.details)}
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="report-section">
        <div class="report-section-title">🗺 What Should You Do Next?</div>
        <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:1.25rem;">Based on the indicators detected, the following actions are recommended:</p>
        ${recs.map(rec=>`
          <div class="rec-item ${rec.priority==='critical'?'rec-critical':rec.priority==='high'?'rec-high':''}">
            <div class="rec-icon">${rec.icon}</div>
            <div>
              <div class="rec-action">${esc(rec.action)}</div>
              <div class="rec-detail">${esc(rec.detail)}</div>
            </div>
          </div>`).join('')}
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer mt-3">
        <strong>Important Disclaimer:</strong> OfferShield AI provides automated risk analysis based on available information and detected indicators. Results are advisory and should not replace independent verification or professional/legal guidance. All demo company names and offer details are entirely fictional. Risk indicators are identified patterns — they do not constitute proof of fraud.
      </div>

      <!-- Bottom actions -->
      <div style="text-align:center; margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--border); display:flex; justify-content:center; gap:.75rem; flex-wrap:wrap;">
        <button class="btn btn-primary"      onclick="resetVerification()">+ Verify Another Offer</button>
        <button class="btn btn-outline"      onclick="downloadReport()">⬇ Download Report</button>
        <a      class="btn btn-ghost"        href="dashboard.html">📊 Dashboard</a>
      </div>
    </div>
  `;

  // Animate risk bar
  requestAnimationFrame(() => {
    const bar = el.querySelector('#rbnBar');
    if (bar) bar.style.width = `${r.riskScore}%`;
  });
}

function ovCard(label, cls, icon, value) {
  return `
    <div class="ov-card">
      <div class="ov-icon ${cls}">${icon}</div>
      <div>
        <div class="ov-lbl">${label}</div>
        <div class="ov-val">${value}</div>
      </div>
    </div>`;
}

function renderTrailDetail(details) {
  if (!details) return '<span style="color:var(--text-muted);">No details.</span>';
  let html = '<div class="trail-kv">';
  for (const [k, v] of Object.entries(details)) {
    if (v === null || v === undefined) continue;
    const key = k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
    let val = Array.isArray(v) ? (v.length ? v.join(', ') : 'None') : typeof v==='object' ? JSON.stringify(v) : String(v);
    if (val.length > 200) val = val.slice(0,200)+'…';
    html += `<div class="trail-kv-row"><span class="trail-key">${esc(key)}:</span><span>${esc(val)}</span></div>`;
  }
  return html + '</div>';
}

/* ── Download ────────────────────────────────────────── */
let _currentReport = null;

function setCurrentReport(data) { _currentReport = data; }

function downloadReport() {
  if (!_currentReport) { alert('No report available to download.'); return; }
  const r = _currentReport.result || _currentReport;
  const s = r.offerSummary || {};
  const inds = r.riskIndicators || [];
  const recs = r.recommendations || [];
  const trail = r.verificationTrail || [];
  const bd = r.scoreBreakdown || [];

  const lines = [
    '='.repeat(60),
    'OFFERSHIELD AI — OFFER VERIFICATION REPORT',
    '='.repeat(60), '',
    `Date: ${new Date().toLocaleString('en-IN')}`, '',
    '--- RISK ASSESSMENT ---',
    `Risk Assessment Score: ${r.riskScore} / 100`,
    `Risk Level: ${r.riskLabel || r.riskLevel}`, '',
    '--- OFFER SUMMARY ---',
    `Company:   ${s.companyName || '—'}`,
    `Role:      ${s.jobTitle || '—'}`,
    `Recruiter: ${s.recruiterName || '—'}`,
    `Email:     ${s.recruiterEmail || '—'}`,
    `Salary:    ${s.salary || '—'}`,
    `Location:  ${s.location || '—'}`, '',
    '--- RISK SCORE BREAKDOWN ---',
    ...bd.map(b => `  +${b.contribution}  ${b.indicator}`),
    `  TOTAL: ${r.riskScore}/100`, '',
    '--- DETECTED WARNING INDICATORS ---',
    ...(inds.length ? inds.flatMap(i => [
      `[${i.severity.toUpperCase()}] ${i.indicator}`,
      `  Evidence: ${i.evidence || 'N/A'}`,
      `  Why: ${i.whyItMatters}`, '',
    ]) : ['  None detected.']), '',
    '--- VERIFICATION TRAIL ---',
    ...trail.map(s => `  Step ${s.step}: ${s.title} (${s.status})`), '',
    '--- RECOMMENDED ACTIONS ---',
    ...recs.map(r => `  ${r.icon} ${r.action}\n     ${r.detail}`), '',
    '='.repeat(60),
    'DISCLAIMER:',
    'OfferShield AI provides automated risk analysis. Results are advisory',
    'and should not replace independent verification or legal guidance.',
    'All demo examples are fictional.',
    '='.repeat(60),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `OfferShield-Report-${Date.now()}.txt` });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

window.renderReport     = renderReport;
window.setCurrentReport = setCurrentReport;
window.downloadReport   = downloadReport;
