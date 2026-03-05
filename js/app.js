// =============================================
// CAR WASH MANAGER — App Logic
// =============================================
// Load order: sheets.js → auth.js → app.js
// Global utility functions defined here are
// available to auth.js and sheets.js at runtime.
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

/**
 * Switch between screens: 'login' | 'setup' | 'app'
 */
function showScreen(name) {
  document.getElementById('login-screen').hidden = (name !== 'login');
  document.getElementById('setup-screen').hidden = (name !== 'setup');
  document.getElementById('app').hidden           = (name !== 'app');
}

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

  // Back button: only show on sub-pages
  const backBtn = document.getElementById('back-btn');
  if (pageName === 'home') {
    backBtn.classList.remove('visible');
  } else {
    backBtn.classList.add('visible');
  }

  currentPage = pageName;
  document.querySelector('.app-main').scrollTop = 0;
}

function goBack() {
  showPage('home', 'Car Wash Manager');
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
// MAIN APP CONTROLLER
// =============================================
const APP = {
  user:    null,
  profile: null,

  /** Called after successful login + sheet init */
  start(user, profile) {
    APP.user    = user;
    APP.profile = profile;

    // Populate header
    document.getElementById('business-name-display').textContent = profile.businessName;
    document.getElementById('user-greeting').textContent = 'Welcome, ' + user.name.split(' ')[0] + '! 👋';

    // User avatar
    const avatars = document.querySelectorAll('.user-avatar, .strip-avatar');
    avatars.forEach(img => {
      if (user.picture) {
        img.src = user.picture;
        img.style.display = 'block';
      }
    });

    // User strip info
    document.getElementById('strip-name').textContent  = user.name;
    document.getElementById('strip-email').textContent = user.email;

    showScreen('app');
    showPage('home', 'Car Wash Manager');
  }
};

// =============================================
// FIRST-TIME SETUP FORM
// =============================================
document.getElementById('setup-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const businessName = document.getElementById('setup-business').value.trim();
  const ownerName    = document.getElementById('setup-owner').value.trim();
  const phone        = document.getElementById('setup-phone').value.trim();

  if (!businessName || !ownerName) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (phone && !/^\d{10}$/.test(phone)) {
    showToast('Enter a valid 10-digit mobile number', 'error');
    return;
  }

  const profile = { businessName, ownerName, phone };
  localStorage.setItem('cw_profile_' + AUTH.user.email, JSON.stringify(profile));

  APP.start(AUTH.user, profile);
  showToast('Profile saved! Welcome to Car Wash Manager 🎉', 'success');
});

// =============================================
// NEW ENTRY FORM
// =============================================
document.getElementById('entry-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const phone = document.getElementById('phone').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'error');
    document.getElementById('phone').focus();
    return;
  }

  const submitBtn  = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  submitBtn.disabled = true;
  submitText.textContent = '⏳ Saving...';

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
    showToast('✅ Entry saved to Google Sheet!', 'success');
    e.target.reset();
    showPage('home', 'Car Wash Manager');
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
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

  if (!query) {
    showToast('Please enter a search term', 'error');
    return;
  }

  if (searchType === 'phone' && !/^\d{7,10}$/.test(query)) {
    showToast('Enter at least 7 digits of the phone number', 'error');
    return;
  }

  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML =
    '<div class="inline-loading"><div class="spinner" style="margin:0 auto 14px"></div>Searching records...</div>';

  try {
    const results = await SHEETS.search(query, searchType);

    if (results.length === 0) {
      resultsDiv.innerHTML = buildNoResults('No records found for "' + query + '"');
      return;
    }

    // Sort newest visit first
    results.sort((a, b) => _parseDate(b.date) - _parseDate(a.date));
    renderResults(results, resultsDiv);

  } catch (err) {
    resultsDiv.innerHTML = buildNoResults('Error: ' + err.message);
    console.error('Search error:', err);
  }
}

// Enter key triggers search
document.getElementById('searchQuery').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') doSearch();
});

// =============================================
// RENDER SEARCH RESULTS
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
      ${vehicles.length
        ? `<div class="customer-meta" style="margin-top:8px">
             ${vehicles.map(v => `<span>🚗 ${esc(v)}</span>`).join('')}
           </div>`
        : ''}
      <div class="customer-meta" style="margin-top:8px">
        <span>💰 Total Spent: ₹${totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
    <div class="section-label">Visit History (${visits.length})</div>`;

  visits.forEach(visit => {
    html += `
      <div class="visit-card">
        <div class="visit-top-row">
          <span class="visit-date">📅 ${esc(visit.date)}</span>
          <span class="visit-amount">₹${esc(visit.amount)}</span>
        </div>
        ${visit.vehicleNumber
          ? `<div class="visit-info-row">
               <span class="info-icon">🚗</span>
               <span>${esc(visit.vehicleNumber)}${visit.vehicleModel ? ` (${esc(visit.vehicleModel)})` : ''}</span>
             </div>` : ''}
        ${visit.serviceType
          ? `<div class="visit-info-row">
               <span class="info-icon">🧹</span>
               <span>${esc(visit.serviceType)}</span>
             </div>` : ''}
        ${visit.staffName
          ? `<div class="visit-info-row">
               <span class="info-icon">👷</span>
               <span>${esc(visit.staffName)}</span>
             </div>` : ''}
        ${visit.notes
          ? `<div class="visit-notes">📝 ${esc(visit.notes)}</div>` : ''}
      </div>`;
  });

  container.innerHTML = html;
}

function buildNoResults(msg) {
  return `<div class="no-results">
    <div class="no-results-icon">🔍</div>
    <p>${esc(msg)}</p>
  </div>`;
}

// =============================================
// UTILITIES
// =============================================
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _parseDate(str) {
  if (!str) return 0;
  // en-IN format: "dd/MM/yyyy hh:mm am" or "dd-MM-yyyy HH:mm"
  let m = str.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})[,\s]+(\d{2}):(\d{2})/i);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
  return new Date(str).getTime() || 0;
}

// Auto-uppercase for vehicle number input
document.getElementById('vehicleNumber').addEventListener('input', function() {
  const pos   = this.selectionStart;
  this.value  = this.value.toUpperCase();
  this.setSelectionRange(pos, pos);
});

// =============================================
// SERVICE WORKER (offline support)
// =============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => {
    console.log('SW registration failed:', err);
  });
}
