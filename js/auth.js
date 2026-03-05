// =============================================
// CAR WASH MANAGER — Google Authentication
// =============================================
//
// 👉 REQUIRED: Replace with YOUR Google Client ID
//    Follow SETUP.md → Step 1 to get this value
//
const GOOGLE_CLIENT_ID = '1044032107946-lv2e6g33226uolkevlfsoo7v5ihq1irf.apps.googleusercontent.com';

// Scopes: identity + Sheets + Drive (to create sheets in user's Drive)
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

// =============================================
const AUTH = {
  token: null,
  user: null,
  tokenClient: null,

  // ---- QUICK START: restore previous session without showing login ----
  quickStart() {
    const savedToken = sessionStorage.getItem('cw_token');
    const savedUser  = localStorage.getItem('cw_user');
    if (!savedToken || !savedUser) return false;

    AUTH.token = savedToken;
    AUTH.user  = JSON.parse(savedUser);

    const sheetId = localStorage.getItem('cw_sheet_' + AUTH.user.email);
    if (!sheetId) return false;

    SHEETS.token         = AUTH.token;
    SHEETS.spreadsheetId = sheetId;

    const profile = localStorage.getItem('cw_profile_' + AUTH.user.email);
    if (profile) {
      APP.start(AUTH.user, JSON.parse(profile));
    } else {
      showScreen('setup');
    }
    return true;
  },

  // ---- BUILD TOKEN CLIENT ----
  _buildTokenClient() {
    AUTH.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: AUTH._onToken,
      error_callback(err) {
        hideLoading();
        console.warn('Auth error:', err.type, err.message);
        // If silent refresh failed, just show login screen
        if (!AUTH.user) showScreen('login');
        else showToast('Session expired. Please sign in again.', 'error');
      }
    });
  },

  // ---- USER CLICKS "SIGN IN WITH GOOGLE" ----
  signIn() {
    showLoading('Connecting to Google...');
    if (!AUTH.tokenClient) AUTH._buildTokenClient();
    // prompt: 'select_account' always shows the account picker
    AUTH.tokenClient.requestAccessToken({ prompt: 'select_account' });
  },

  // ---- SIGN OUT ----
  signOut() {
    if (AUTH.token) {
      google.accounts.oauth2.revoke(AUTH.token, () => {});
    }
    AUTH.token = null;
    AUTH.user  = null;
    SHEETS.reset();
    sessionStorage.removeItem('cw_token');
    localStorage.removeItem('cw_user');
    // Keep sheet ID + profile so next login is seamless
    showScreen('login');
    showToast('Signed out successfully', 'info');
  },

  // ---- CALLED AFTER TOKEN IS GRANTED ----
  async _onToken(response) {
    if (response.error) {
      hideLoading();
      if (response.error !== 'access_denied') {
        showToast('Sign-in failed: ' + response.error, 'error');
      }
      if (!AUTH.user) showScreen('login');
      return;
    }

    AUTH.token = response.access_token;
    sessionStorage.setItem('cw_token', AUTH.token);

    // Fetch Google profile if not already stored
    if (!AUTH.user) {
      try {
        showLoading('Getting your account info...');
        const res  = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: 'Bearer ' + AUTH.token }
        });
        const info = await res.json();
        if (info.error) throw new Error(info.error.message);

        AUTH.user = {
          name:    info.name,
          email:   info.email,
          picture: info.picture || ''
        };
        localStorage.setItem('cw_user', JSON.stringify(AUTH.user));
      } catch (e) {
        hideLoading();
        showToast('Could not get account info. Please try again.', 'error');
        console.error('userinfo error:', e);
        return;
      }
    }

    // Initialize Google Sheet (create one if this is a new user)
    showLoading('Setting up your Google Sheet...');
    try {
      SHEETS.token = AUTH.token;
      await SHEETS.init(AUTH.user.email);
    } catch (e) {
      hideLoading();
      showToast('Google Sheet error: ' + e.message, 'error');
      console.error('Sheet init error:', e);
      return;
    }

    hideLoading();

    // Show profile setup for first-time users; otherwise go to app
    const profile = localStorage.getItem('cw_profile_' + AUTH.user.email);
    if (!profile) {
      showScreen('setup');
    } else {
      APP.start(AUTH.user, JSON.parse(profile));
    }
  }
};

// =============================================
// Called automatically by the GIS library when it has loaded
// =============================================
function onGoogleLibraryLoad() {
  // Guard: show a friendly message if Client ID not configured
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    document.getElementById('login-screen').innerHTML = `
      <div class="auth-card">
        <div class="auth-logo" style="font-size:48px">⚙️</div>
        <h2 class="auth-title">One-Time Setup Needed</h2>
        <p class="auth-subtitle" style="text-align:left;line-height:1.8">
          <strong>Step 1:</strong> Open <code>js/auth.js</code><br/>
          <strong>Step 2:</strong> Replace <code>YOUR_GOOGLE_CLIENT_ID</code> with your actual Client ID<br/>
          <strong>Step 3:</strong> See <strong>SETUP.md</strong> for full instructions
        </p>
      </div>`;
    return;
  }

  // Try to restore session silently
  const restored = AUTH.quickStart();
  if (!restored) {
    AUTH._buildTokenClient();
    // If user is remembered but token expired, silently refresh
    const savedUser = localStorage.getItem('cw_user');
    if (savedUser) {
      AUTH.user = JSON.parse(savedUser);
      AUTH.tokenClient.requestAccessToken({ prompt: '' });
    } else {
      showScreen('login');
    }
  }
}
