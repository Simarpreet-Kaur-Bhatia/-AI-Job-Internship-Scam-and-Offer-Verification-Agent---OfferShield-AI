/**
 * main.js — Shared navigation, auth state, tabs, accordions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  updateNavAuth();
  initTabs();
  initAccordions();
});

/* ── Navigation toggle ──────────────────────────────── */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ── Auth state → update nav ────────────────────────── */
function updateNavAuth() {
  const user = window.OfferShieldAPI ? window.OfferShieldAPI.getUser() : null;
  const navLogin    = document.getElementById('navLogin');
  const navRegister = document.getElementById('navRegister');
  const navActions  = document.getElementById('navActions');

  if (user) {
    if (navLogin)    { navLogin.textContent = 'Dashboard'; navLogin.href = 'dashboard.html'; }
    if (navRegister) { navRegister.textContent = '👤 ' + user.name.split(' ')[0]; navRegister.href = 'dashboard.html'; }
    if (navActions && !document.getElementById('navLogoutBtn')) {
      const btn = document.createElement('button');
      btn.id = 'navLogoutBtn';
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = 'Logout';
      btn.onclick = logout;
      navActions.appendChild(btn);
    }
    // Sidebar
    const sidebarLogin    = document.getElementById('sidebarLogin');
    const sidebarRegister = document.getElementById('sidebarRegister');
    const sidebarLogout   = document.getElementById('sidebarLogoutItem');
    if (sidebarLogin)    sidebarLogin.closest('li').classList.add('hidden');
    if (sidebarRegister) sidebarRegister.closest('li').classList.add('hidden');
    if (sidebarLogout)   sidebarLogout.classList.remove('hidden');

    const greeting = document.getElementById('dashGreeting');
    if (greeting) greeting.textContent = `Welcome back, ${user.name.split(' ')[0]}`;
    const demoNote = document.getElementById('demoNote');
    if (demoNote) demoNote.style.display = 'none';
  }
}

function logout() {
  if (window.OfferShieldAPI) window.OfferShieldAPI.clearAuth();
  window.location.href = 'index.html';
}

/* ── Tab system ─────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-list').forEach(tabList => {
    tabList.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const container = btn.closest('.tab-list').parentElement;
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = container.querySelector('#' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  });
}

/* ── Accordion / trail expand ───────────────────────── */
function initAccordions() {
  document.addEventListener('click', e => {
    // Indicator cards
    const indHeader = e.target.closest('.ind-header');
    if (indHeader) { indHeader.closest('.ind-card').classList.toggle('open'); return; }
    // Trail steps
    const trailTitle = e.target.closest('.trail-title');
    if (trailTitle) {
      const detail = trailTitle.nextElementSibling;
      if (detail && detail.classList.contains('trail-detail')) detail.classList.toggle('open');
    }
  });
}

/* ── Alert helpers ──────────────────────────────────── */
function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

/* ── Utilities ──────────────────────────────────────── */
function formatDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch (_) { return str; }
}
function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ── Expose globals ──────────────────────────────────── */
window.logout      = logout;
window.showAlert   = showAlert;
window.hideAlert   = hideAlert;
window.formatDate  = formatDate;
window.getUrlParam = getUrlParam;
