# Car Wash Manager — Setup Guide

## What changed in this version
- ✅ **Client ID is hardcoded in index.html** — clients never see any setup screen
- ✅ **Sheet name is always "Car Wash Records"** in every client's Google Drive
- ✅ **Sheet sync fixed** — uses correct Sheets API v4 endpoint
- ✅ **One-time setup** — you do this once, all clients just sign in with Google

---

## Step 1 — Google Cloud Setup (you do this once)

### 1a. Create a Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click **New Project** → name it "Car Wash App" → Create

### 1b. Enable APIs
1. Go to **APIs & Services → Library**
2. Search & enable: **Google Sheets API**
3. Search & enable: **Google Drive API**

### 1c. Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. User Type: **External** → Create
3. App name: `Car Wash Manager`
4. User support email: your email
5. Developer contact: your email
6. Click **Save and Continue** through all steps
7. On **Test users** — add the emails of your clients (up to 100 while unverified)
8. Submit

> **Note:** While your app is in "Testing" mode, only users you add as Test Users can sign in.
> For production (unlimited users), submit for Google verification — takes ~2 weeks.
> For <100 clients, just add them as test users and skip verification.

### 1d. Create OAuth Client ID
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Car Wash Web`
5. Under **Authorized JavaScript origins**, add:
   - `https://YOUR_USERNAME.github.io`
   - `http://localhost` (for local testing)
6. Click **Create**
7. **Copy the Client ID** — looks like `123456789.apps.googleusercontent.com`

---

## Step 2 — Add Your Client ID to the Code

Open `index.html` and find this line near the top:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID.

That's the only code change needed. Clients will never see or enter this.

---

## Step 3 — Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `car-wash-app`)
2. Upload `index.html`, `sw.js`, `manifest.json`
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch** → Branch: `main` → `/root`
5. Save. Your app is live at `https://YOUR_USERNAME.github.io/car-wash-app`

---

## Step 4 — Share with Clients

Send each client this link: `https://YOUR_USERNAME.github.io/car-wash-app`

**First time for each client:**
1. Open the link in Chrome
2. Tap **Sign in with Google** → choose their Gmail account
3. Grant permissions (Sheets + Drive)
4. Set a 4-digit PIN
5. Done! Their data goes into their own Google Drive in a sheet called **"Car Wash Records"**

**Install on phone (optional):**
- Android: Chrome will show "Add to Home Screen" banner
- iOS: Safari → Share → Add to Home Screen

---

## How Data Works

| What | Where |
|------|-------|
| Records | Client's Google Drive → "Car Wash Records" spreadsheet |
| Offline cache | Phone's local storage (instant, no internet needed) |
| Sync | Automatic when online; manual sync button available |

Each client's data is **completely separate** — nobody can see anyone else's data.

---

## Troubleshooting

**"Google hasn't verified this app" warning:**
→ Click "Advanced" → "Go to Car Wash Manager (unsafe)" — this appears because the app isn't verified yet. Add the client as a Test User in Google Cloud Console to avoid this.

**Sheet not syncing:**
→ Tap the 🔄 button in the top-right, or go to Settings → Force Sync

**Signed out unexpectedly:**
→ Google tokens expire after ~1 hour. Sign in again — data is safe in the sheet.
