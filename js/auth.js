// =============================================
// CAR WASH MANAGER — PIN Authentication
// + Auto-registration with Google Sheet creation
// Works perfectly in Android APK WebView
// =============================================

const AUTH = {

  isSetupDone() {
    return !!(
      localStorage.getItem('cw_pin') &&
      localStorage.getItem('cw_profile') &&
      localStorage.getItem('cw_sheet_id')
    );
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
  }
};

// =============================================
// PIN UI CONTROLLER
// =============================================
const PINUI = {
  values:       { setup: '', login: '' },
  setupPhase:   'set',
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
    if (mode === 'login') this.handleLogin();
    else this.handleSetupPin();
  },

  handleLogin() {
    if (AUTH.verifyPin(this.values['login'])) {
      AUTH.login();
      APP.start(AUTH.getProfile());
    } else {
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
      this.setupPhase    = 'confirm';
      this.clearDots('setup');
      document.getElementById('setup-pin-hint').textContent = '🔁 Confirm your PIN';
    } else {
      if (this.values['setup'] === this.setupFirstPin) {
        // PINs match — complete setup
        this._finishSetup(this.values['setup']);
      } else {
        this.setupPhase    = 'set';
        this.setupFirstPin = '';
        this.clearDots('setup');
        document.getElementById('setup-pin-hint').textContent = '❌ PINs did not match. Try again.';
        setTimeout(() => {
          document.getElementById('setup-pin-hint').textContent = 'Enter a 4-digit PIN';
        }, 2000);
      }
    }
  },

  async _finishSetup(pin) {
    const profile = AUTH.getProfile();
    showLoading('Creating your Google Sheet...');

    try {
      // AUTO-CREATE Google Sheet for this client
      const result = await SHEETS.register(profile);

      AUTH.savePin(pin);
      AUTH.login();
      hideLoading();

      showToast('🎉 Setup complete! Your Google Sheet is ready!', 'success');
      APP.start(profile);

    } catch (err) {
      hideLoading();
      // If registration fails, allow retry
      this.setupPhase    = 'set';
      this.setupFirstPin = '';
      this.clearDots('setup');
      document.getElementById('setup-pin-hint').textContent = '❌ ' + err.message;
      setTimeout(() => {
        document.getElementById('setup-pin-hint').textContent = 'Enter a 4-digit PIN';
      }, 3000);
    }
  }
};

// =============================================
// APP INIT — runs on page load
// =============================================
window.addEventListener('DOMContentLoaded', function() {
  if (!AUTH.isSetupDone()) {
    showScreen('setup');
    goSetupStep(1);
  } else if (AUTH.isLoggedIn()) {
    APP.start(AUTH.getProfile());
  } else {
    showScreen('login');
    const profile = AUTH.getProfile();
    if (profile) {
      document.getElementById('pin-biz-name').textContent =
        profile.businessName || 'Car Wash Manager';
    }
  }
});
