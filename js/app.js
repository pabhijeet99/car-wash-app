// =============================================
// CAR WASH MANAGER — App Logic
// APK-friendly: No external libraries
// =============================================

// =============================================
// GLOBAL UTILITIES
// =============================================
let _toastTimer = null;

function showToast(msg, type) {
  type = type || 'success';
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

function showLoading(text) {
  document.getElementById('loading-text').textContent = text || 'Please wait...';
  document.getElementById('loading').removeAttribute('hidden');
}

function hideLoading() {
  document.getElementById('loading').setAttribute('hidden', '');
}

function showScreen(name) {
  document.getElementById('screen-setup').hidden = (name !== 'setup');
  document.getElementById('screen-login').hidden = (name !== 'login');
  document.getElementById('app').hidden           = (name !== 'app');
}

// =============================================
// SETUP WIZARD NAVIGATION
// =============================================
function goSetupStep(step) {
  document.querySelectorAll('.setup-step').forEach(el => el.hidden = true);
  document.getElementById('setup-step-' + step).hidden = false;
}

// Setup Step 1: Business Info
document.getElementById('setup-form-1').addEventListener('submit', function(e) {
  e.preventDefault();
  const business = document.getElementById('s-business').value.trim();
  const owner    = document.getElementById('s-owner').value.trim();
  const phone    = document.getElementById('s-phone').value.trim();

  if (phone && !/^\d{10}$/.test(phone)) {
    showToast('Enter a valid 10-digit mobile number', 'error');
    return;
  }

  AUTH.saveProfile({ businessName: business, ownerName: owner, phone });
  goSetupStep(2);
});

// Setup Step 2: Apps Script URL
document.getElementById('setup-form-2').addEventListener('submit', function(e) {
  e.preventDefault();
  const url = document.getElementById('s-url').value.trim();

  if (!url.includes('script.google.com')) {
    showToast('Please enter a valid Apps Script URL', 'error');
    return;
  }

  AUTH.saveApiUrl(url);
  // Reset PIN UI
  PINUI.setupPhase    = 'set';
  PINUI.setupFirstPin = '';
  PINUI.clearDots('setup');
  document.getElementById('setup-pin-hint').textContent = 'Enter a 4-digit PIN';
  goSetupStep(3);
});

// =============================================
// NAVIGATION
// =============================================
let currentPage = 'home';
let searchType  = 'phone';

function showPage(pageName, title) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('page-' + pageName).classList.add('active');
  const navBtn = document.getElementById('nav-' + pageName);
  if (navBtn) navBtn.classList.add('active');

  document.getElementById('header-text').textContent = title || 'Car Wash Manager';

  const backBtn = document.getElementById('back-btn');
  if (pageName === 'home') {
    backBtn.classList.remove('visible');
  } else {
    backBtn.classList.add('visible');
  }

  currentPage = pageName;
  document.querySelector('.app-main').scrollTop = 0;

  // Populate settings when opening
  if (pageName === 'settings') populateSettings();
}

function goBack() {
  showPage('home', 'Car Wash Manager');
}

// =============================================
// MAIN APP CONTROLLER
// =============================================
const APP = {
  start(profile) {
    if (!profile) profile = { businessName: 'Car Wash Manager', ownerName: '' };

    document.getElementById('business-name-display').textContent = profile.businessName;
    document.getElementById('user-greeting').textContent = 'Welcome, ' + (profile.ownerName || 'Owner') + '! 👋';
    document.getElementById('strip-info').textContent    = profile.businessName;

    showScreen('app');
    showPage('home', 'Car Wash Manager');
  }
};

// =============================================
// SETTINGS PAGE
// =============================================
function populateSettings() {
  const profile = AUTH.getProfile() || {};
  document.getElementById('set-business').value = profile.businessName || '';
  document.getElementById('set-owner').value    = profile.ownerName    || '';
  document.getElementById('set-phone').value    = profile.phone        || '';
  document.getElementById('set-url').value      = AUTH.getApiUrl()     || '';
}

function saveSettings() {
  const business = document.getElementById('set-business').value.trim();
  const owner    = document.getElementById('set-owner').value.trim();
  const phone    = document.getElementById('set-phone').value.trim();
  const url      = document.getElementById('set-url').value.trim();

  if (!business) { showToast('Business name is required', 'error'); return; }

  AUTH.saveProfile({ businessName: business, ownerName: owner, phone });
  if (url) AUTH.saveApiUrl(url);

  document.getElementById('business-name-display').textContent = business;
  document.getElementById('strip-info').textContent            = business;

  showToast('✅ Settings saved!', 'success');
}

function changePin() {
  // Reset PIN setup
  PINUI.setupPhase    = 'set';
  PINUI.setupFirstPin = '';
  PINUI.clearDots('setup');
  document.getElementById('setup-pin-hint').textContent = 'Enter your new 4-digit PIN';
  goSetupStep(3);
  showScreen('setup');
}

// =============================================
// SEARCH TYPE TOGGLE
// =============================================
function setSearchType(type, btn) {
  searchType = type;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const input = document.getElementById('searchQuery');
  input.value = '';
  document.getElementById('search-results').innerHTML = '';

  if (type === 'phone') {
    input.type        = 'tel';
    input.placeholder = 'Enter phone number...';
    input.maxLength   = 10;
  } else {
    input.type        = 'text';
    input.placeholder = 'Enter vehicle number (e.g. KA01AB1234)';
    input.maxLength   = 15;
  }
}

// =============================================
// NEW ENTRY FORM
// =============================================
document.getElementById('entry-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const phone = document.getElementById('phone').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'error');
    return;
  }

  const submitBtn  = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  submitBtn.disabled = true;
  submitText.textContent = '⏳ Saving...';
  showLoading('Saving to Google Sheet...');

  const record = {
    customerName:  document.getElementById('customerName').value.trim(),
    phone,
    vehicleNumber: document.getElementById('vehicleNumber').value.trim().toUpperCase(),
    vehicleModel:  document.getElementById('vehicleModel').value.trim(),
    serviceType:   document.getElementById('serviceType').value,
    amount:        document.getElementById('amount').value,
    staffName:     document.getElementById('staffName').value.trim(),
    notes:         document.getElementById('notes').value.trim()
  };

  try {
    await SHEETS.addRecord(record);
    hideLoading();
    showToast('✅ Entry saved to Google Sheet!', 'success');
    e.target.reset();
    showPage('home', 'Car Wash Manager');
  } catch (err) {
    hideLoading();
    showToast('❌ ' + err.message, 'error');
    console.error('Save error:', err);
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = '💾 Save Entry';
  }
});

// =============================================
// SEARCH
// =============================================
async function doSearch() {
  const query = document.getElementById('searchQuery').value.trim();
  if (!query) { showToast('Please enter a search term', 'error'); return; }

  if (searchType === 'phone' && !/^\d{7,10}$/.test(query)) {
    showToast('Enter at least 7 digits of phone number', 'error');
    return;
  }

  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '<div class="inline-loading"><div class="spinner" style="margin:0 auto 14px"></div>Searching...</div>';

  try {
    const results = await SHEETS.search(query, searchType);
    if (results.length === 0) {
      resultsDiv.innerHTML = buildNoResults('No records found for "' + query + '"');
      return;
    }
    results.sort((a, b) => _parseDate(b.date) - _parseDate(a.date));
    renderResults(results, resultsDiv);
  } catch (err) {
    resultsDiv.innerHTML = buildNoResults('Error: ' + err.message);
  }
}

document.getElementById('searchQuery').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') doSearch();
});

// =============================================
// RENDER RESULTS
// =============================================
function renderResults(visits, container) {
  const first       = visits[0];
  const totalAmount = visits.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const vehicles    = [...new Set(visits.map(v => v.vehicleNumber).filter(Boolean))];

  let html = `
    <div class="customer-summary-card">
      <h3>👤 ${esc(first.customerName)}</h3>
      <div class="customer-meta">
        <span>📱 ${esc(first.phone)}</span>
        <span class="visit-badge">${visits.length} Visit${visits.length !== 1 ? 's' : ''}</span>
      </div>
      ${vehicles.length ? `<div class="customer-meta" style="margin-top:8px">${vehicles.map(v => `<span>🚗 ${esc(v)}</span>`).join('')}</div>` : ''}
      <div class="customer-meta" style="margin-top:8px">
        <span>💰 Total Spent: ₹${totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
    <div class="section-label">Visit History (${visits.length})</div>`;

  visits.forEach(v => {
    html += `
      <div class="visit-card">
        <div class="visit-top-row">
          <span class="visit-date">📅 ${esc(v.date)}</span>
          <span class="visit-amount">₹${esc(v.amount)}</span>
        </div>
        ${v.vehicleNumber ? `<div class="visit-info-row"><span class="info-icon">🚗</span><span>${esc(v.vehicleNumber)}${v.vehicleModel ? ` (${esc(v.vehicleModel)})` : ''}</span></div>` : ''}
        ${v.serviceType   ? `<div class="visit-info-row"><span class="info-icon">🧹</span><span>${esc(v.serviceType)}</span></div>` : ''}
        ${v.staffName     ? `<div class="visit-info-row"><span class="info-icon">👷</span><span>${esc(v.staffName)}</span></div>` : ''}
        ${v.notes         ? `<div class="visit-notes">📝 ${esc(v.notes)}</div>` : ''}
      </div>`;
  });

  container.innerHTML = html;
}

function buildNoResults(msg) {
  return `<div class="no-results"><div class="no-results-icon">🔍</div><p>${esc(msg)}</p></div>`;
}

// =============================================
// UTILITIES
// =============================================
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _parseDate(str) {
  if (!str) return 0;
  const m = str.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  return new Date(str).getTime() || 0;
}

// Auto-uppercase vehicle number
document.getElementById('vehicleNumber').addEventListener('input', function() {
  const pos = this.selectionStart;
  this.value = this.value.toUpperCase();
  this.setSelectionRange(pos, pos);
});

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
