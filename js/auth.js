// =============================================
// CAR WASH MANAGER — PIN Authentication
// No OAuth / No Google Sign-In
// Works perfectly in Android APK WebView
// =============================================

const AUTH = {

  isSetupDone() {
    return !!(localStorage.getItem('cw_pin') &&
              localStorage.getItem('cw_profile') &&
              localStorage.getItem('cw_api_url'));
  },

  isLoggedIn() {
    return sessionStorage.getItem('cw_session') === '1';
  },

  getProfile() {
    const p = localStorage.getItem('cw_profile');
    return p ? JSON.parse(p) : null;
  },

  saveProfile(profile) {
    localStorage.setItem('cw_profile', JSON.stringify(profile));
  },

  saveApiUrl(url) {
    localStorage.setItem('cw_api_url', url.trim());
  },

  getApiUrl() {
    return localStorage.getItem('cw_api_url') || '';
  },

  savePin(pin) {
    localStorage.setItem('cw_pin', pin);
  },

  verifyPin(pin) {
    return localStorage.getItem('cw_pin') === pin;
  },

  login() {
    sessionStorage.setItem('cw_session', '1');
  },

  logout() {
    sessionStorage.removeItem('cw_session');
    showScreen('login');
    showToast('App locked', 'info');
  },

  resetAll() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
};

// =============================================
// PIN UI CONTROLLER
// =============================================
const PINUI = {
  values: { setup: '', login: '' },
  setupPhase: 'set',     // 'set' or 'confirm'
  setupFirstPin: '',

  press(mode, digit) {
    if (this.values[mode].length >= 4) return;
    this.values[mode] += digit;
    this.updateDots(mode);

    if (this.values[mode].length === 4) {
      setTimeout(() => this.onComplete(mode), 200);
    }
  },

  del(mode) {
    this.values[mode] = this.values[mode].slice(0, -1);
    this.updateDots(mode);
  },

  updateDots(mode) {
    const prefix = mode === 'setup' ? 'sd' : 'ld';
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(prefix + i);
      if (dot) dot.classList.toggle('filled', i < this.values[mode].length);
    }
  },

  clearDots(mode) {
    this.values[mode] = '';
    this.updateDots(mode);
  },

  onComplete(mode) {
    if (mode === 'login') {
      this.handleLogin();
    } else {
      this.handleSetupPin();
    }
  },

  handleLogin() {
    const pin = this.values['login'];
    if (AUTH.verifyPin(pin)) {
      AUTH.login();
      const profile = AUTH.getProfile();
      APP.start(profile);
    } else {
      // Wrong PIN
      document.getElementById('login-pin-error').textContent = '❌ Wrong PIN. Try again.';
      document.getElementById('screen-login').classList.add('shake');
      setTimeout(() => {
        document.getElementById('screen-login').classList.remove('shake');
        document.getElementById('login-pin-error').textContent = '';
        this.clearDots('login');
      }, 800);
    }
  },

  handleSetupPin() {
    if (this.setupPhase === 'set') {
      this.setupFirstPin = this.values['setup'];
      this.setupPhase = 'confirm';
      this.clearDots('setup');
      document.getElementById('setup-pin-hint').textContent = '🔁 Confirm your PIN';
    } else {
      // Confirm phase
      if (this.values['setup'] === this.setupFirstPin) {
        // PINs match — finish setup
        AUTH.savePin(this.values['setup']);
        AUTH.login();
        const profile = AUTH.getProfile();
        APP.start(profile);
        showToast('🎉 Setup complete! Welcome!', 'success');
      } else {
        // Mismatch
        this.setupPhase = 'set';
        this.setupFirstPin = '';
        this.clearDots('setup');
        document.getElementById('setup-pin-hint').textContent = '❌ PINs did not match. Try again.';
        setTimeout(() => {
          document.getElementById('setup-pin-hint').textContent = 'Enter a 4-digit PIN';
        }, 2000);
      }
    }
  }
};

// =============================================
// APP INITIALISATION (runs on page load)
// =============================================
window.addEventListener('DOMContentLoaded', function () {
  if (!AUTH.isSetupDone()) {
    showScreen('setup');
    goSetupStep(1);
  } else if (AUTH.isLoggedIn()) {
    // Session still active (tab not closed)
    APP.start(AUTH.getProfile());
  } else {
    // Show PIN login
    showScreen('login');
    const profile = AUTH.getProfile();
    if (profile) {
      document.getElementById('pin-biz-name').textContent = profile.businessName || 'Car Wash Manager';
    }
  }
});
