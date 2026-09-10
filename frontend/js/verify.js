/**
 * verify.js — Verification page logic
 * Handles tab input, demo selection, file upload, animation, and API call.
 */

let _selectedDemo = null;
let _selectedFile = null;

/* ── Demo selection ─────────────────────────────────── */
function selectDemo(type) {
  _selectedDemo = type;
  document.querySelectorAll('.demo-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`demoCard-${type}`);
  if (card) card.classList.add('selected');
  const alert = document.getElementById('demoSelectedAlert');
  if (alert) alert.classList.add('show');
  // Show demo banner
  const banner = document.getElementById('demoBanner');
  if (banner) banner.classList.remove('hidden');
}

function clearDemoMode() {
  _selectedDemo = null;
  document.querySelectorAll('.demo-card').forEach(c => c.classList.remove('selected'));
  const alert  = document.getElementById('demoSelectedAlert');
  const banner = document.getElementById('demoBanner');
  if (alert)  alert.classList.remove('show');
  if (banner) banner.classList.add('hidden');
}

/* ── File upload ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const dropZone  = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileRemoveBtn = document.getElementById('fileRemove');

  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput && fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    });
  }
  if (fileInput) fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFileSelect(fileInput.files[0]); });
  if (fileRemoveBtn) fileRemoveBtn.addEventListener('click', clearFile);

  // Handle ?demo= URL param
  const demoParam = getUrlParam('demo');
  if (demoParam && ['high_risk', 'needs_verification', 'low_risk'].includes(demoParam)) {
    // Switch to demo tab
    const demoTabBtn = document.querySelector('[data-tab="tabDemo"]');
    if (demoTabBtn) demoTabBtn.click();
    selectDemo(demoParam);
  }
});

function handleFileSelect(file) {
  const allowed = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/jpg', 'image/png',
  ];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
    showAlert('inputError', 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showAlert('inputError', 'File too large. Maximum 10 MB.', 'error');
    return;
  }
  _selectedFile = file;
  const nameEl = document.getElementById('fileName');
  const info   = document.getElementById('fileChosen');
  if (nameEl) nameEl.textContent = `${file.name}  (${(file.size / 1024).toFixed(1)} KB)`;
  if (info)   info.classList.remove('hidden');
  hideAlert('inputError');
}

function clearFile() {
  _selectedFile = null;
  const info  = document.getElementById('fileChosen');
  const input = document.getElementById('fileInput');
  if (info)  info.classList.add('hidden');
  if (input) input.value = '';
}

/* ── Processing animation ───────────────────────────── */
function runProcessingAnimation(onDone) {
  const steps = document.querySelectorAll('.proc-step');
  let i = 0;

  function tick() {
    if (i > 0) {
      const prev = steps[i - 1];
      prev.classList.remove('active');
      prev.classList.add('done');
      prev.querySelector('.proc-dot').textContent = '✓';
    }
    if (i < steps.length) {
      steps[i].classList.add('active');
      i++;
      setTimeout(tick, 380 + Math.random() * 220);
    } else {
      setTimeout(onDone, 300);
    }
  }

  steps.forEach(s => {
    s.classList.remove('active', 'done');
    s.querySelector('.proc-dot').textContent = '';
  });
  tick();
}

/* ── Main verification ──────────────────────────────── */
async function startVerification() {
  hideAlert('inputError');

  const activeTabBtn = document.querySelector('.tab-btn.active');
  const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'tabText';

  const inputSection = document.getElementById('inputSection');
  const processingScreen = document.getElementById('processingScreen');
  const reportContainer  = document.getElementById('reportContainer');
  const startBtn = document.getElementById('startBtn');

  // Validate
  let apiCall = null;

  if (activeTab === 'tabDemo') {
    if (!_selectedDemo) {
      showAlert('inputError', 'Please select a demo offer from the cards above.', 'error');
      return;
    }
    apiCall = () => window.OfferShieldAPI.verify.verifyDemo(_selectedDemo);

  } else if (activeTab === 'tabUpload') {
    if (!_selectedFile) {
      showAlert('inputError', 'Please select a file to upload.', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('file', _selectedFile);
    apiCall = () => window.OfferShieldAPI.verify.verifyFile(fd);

  } else if (activeTab === 'tabUrl') {
    const url     = (document.getElementById('offerUrl')?.value   || '').trim();
    const context = (document.getElementById('urlContext')?.value || '').trim();
    if (!url && !context) {
      showAlert('inputError', 'Please enter a URL or paste additional context.', 'error');
      return;
    }
    apiCall = () => window.OfferShieldAPI.verify.verifyUrl(url, context);

  } else {
    const text = (document.getElementById('offerText')?.value || '').trim();
    if (!text || text.length < 20) {
      showAlert('inputError', 'Please paste your offer message (minimum 20 characters).', 'error');
      return;
    }
    apiCall = () => window.OfferShieldAPI.verify.verifyText(text);
  }

  // Show processing
  if (inputSection) inputSection.style.display = 'none';
  if (processingScreen) processingScreen.classList.add('show');
  if (reportContainer)  reportContainer.classList.add('hidden');
  if (startBtn) startBtn.disabled = true;

  let apiResult = null;
  let apiError  = null;
  let apiDone   = false;
  let animDone  = false;

  function tryShow() {
    if (!apiDone || !animDone) return;
    if (processingScreen) processingScreen.classList.remove('show');

    if (apiError) {
      if (inputSection) inputSection.style.display = '';
      if (startBtn) startBtn.disabled = false;
      showAlert('inputError', apiError, 'error');
      return;
    }
    if (reportContainer) {
      reportContainer.classList.remove('hidden');
      window.setCurrentReport(apiResult);
      window.renderReport(apiResult, 'reportContainer');
      reportContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (startBtn) startBtn.disabled = false;
  }

  runProcessingAnimation(() => { animDone = true; tryShow(); });

  try {
    apiResult = await apiCall();
    apiDone = true;
    tryShow();
  } catch (err) {
    apiError = err.message || 'Verification failed. Please try again.';
    apiDone  = true;
    tryShow();
  }
}

function resetVerification() {
  const inputSection = document.getElementById('inputSection');
  const processingScreen = document.getElementById('processingScreen');
  const reportContainer  = document.getElementById('reportContainer');
  const startBtn = document.getElementById('startBtn');

  if (inputSection) inputSection.style.display = '';
  if (processingScreen) processingScreen.classList.remove('show');
  if (reportContainer)  reportContainer.classList.add('hidden');
  if (startBtn) startBtn.disabled = false;

  const offerText = document.getElementById('offerText');
  const offerUrl  = document.getElementById('offerUrl');
  if (offerText) offerText.value = '';
  if (offerUrl)  offerUrl.value  = '';
  clearFile();
  clearDemoMode();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.selectDemo       = selectDemo;
window.clearDemoMode    = clearDemoMode;
window.startVerification = startVerification;
window.resetVerification = resetVerification;
