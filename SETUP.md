# Car Wash Manager — Setup & Go Live Guide

## What Changed in This Version

| Feature | Before | Now |
|---|---|---|
| Sheet Name | "Car Wash Records" | **"Car Wash Data"** ✅ |
| UI | Basic | Dark modern design |
| KPIs | 2 cards | 5 KPIs (total, today, top service) |
| Analytics page | ❌ | ✅ Revenue charts + service breakdown |
| Recent entries | ❌ | ✅ Live recent list on home |
| Offline support | Basic | Full local data cache |
| PIN change | Working | Fixed |

---

## STEP 1 — Upload to GitHub (Make It Live for Free)

### 1a. Create GitHub Account
Go to **github.com** → Sign Up (free)

### 1b. Create a new repository
- Click **+** → **New repository**
- Name: `car-wash-app`
- Set to **Public**
- Click **Create repository**

### 1c. Upload files
Upload ALL 3 files from this package:
```
index.html
manifest.json
sw.js
```
- On the repo page click **"uploading an existing file"**
- Drag all 3 files → **Commit changes**

### 1d. Enable GitHub Pages
- Go to repository **Settings** → **Pages**
- Source: **Deploy from branch** → Branch: **main** → `/ (root)`
- Click **Save**

✅ Your app will be live at:
```
https://YOUR_GITHUB_USERNAME.github.io/car-wash-app
```
(Wait 2-3 minutes for first deploy)

---

## STEP 2 — Connect Google Sheets (for cloud sync)

> **Note:** The app works fully offline/locally without this step. Entries are stored on your phone. Skip this step if you just want to get started quickly — you can add sheet sync later.

### 2a. Create Google Cloud Project
1. Go to **console.cloud.google.com**
2. Create a new project → Name: `Car Wash Manager`

### 2b. Enable APIs
- **APIs & Services → Library**
- Enable **Google Sheets API**
- Enable **Google Drive API**

### 2c. Create OAuth Client ID
1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Configure consent screen (External, add your email)
3. Application type: **Web application**
4. Authorized JavaScript origins:
   - `https://YOUR_USERNAME.github.io`
   - `http://localhost` (for testing)
5. Copy the **Client ID**

### 2d. Add Client ID to the app
Open `index.html`, find this line near the bottom:
```javascript
const clientId = cfg && cfg.clientId ? cfg.clientId : '';
```

**Better approach:** In the app's Settings page, there will be a "Client ID" field where you can paste it without editing code. *(This field is pre-wired in the Settings section.)*

---

## STEP 3 — First Time Setup on Phone

1. Open Chrome on your Android phone
2. Go to your GitHub Pages URL
3. You'll see the **Setup Wizard**:
   - Enter Business Name, Owner Name, Phone
   - Enter your Gmail (where the sheet will be shared)
   - Set a 4-digit PIN
4. The app creates a Google Sheet called **"Car Wash Data"** in your Drive

### Install on Home Screen (Android)
1. Tap **⋮** menu in Chrome
2. **Add to Home Screen** → **Add**

### Install on Home Screen (iPhone)
1. Open in **Safari**
2. Tap Share → **Add to Home Screen**

---

## HOW THE APP WORKS

```
Open App
   │
   ▼
PIN Login Screen
   │
   ▼
Home (KPIs + Recent)
   ├── New Entry → Saves to phone + Google Sheet
   ├── Search → By phone or vehicle number
   ├── Analytics → Revenue charts, service breakdown
   └── Settings → Edit info, Change PIN, Fix Sheet
```

## Google Sheet Format ("Car Wash Data")

| Date & Time | Customer Name | Phone | Vehicle No. | Vehicle Model | Service Type | Amount (₹) | Staff | Notes |
|---|---|---|---|---|---|---|---|---|
| 01/06/2026 10:30 am | Rajesh Kumar | 9876543210 | KA01AB1234 | Swift | Full Wash | 500 | Ramu | Clean |

---

## TROUBLESHOOTING

**"PIN screen shows but can't log in"**
- Make sure you completed all 3 setup steps

**"Entry saves but not on Sheet"**
- Go to Settings → Fix Sheet Connection → Re-Register
- Or check your Google Cloud credentials

**"App not loading on phone"**
- Make sure GitHub Pages is enabled and deployed (wait 5 min)
- Check the URL — must include `/car-wash-app` at the end

**"Want to reset the app"**
- Open browser DevTools → Application → Local Storage → Clear

---

## FILE STRUCTURE

```
car-wash-app/
├── index.html     ← Complete app (UI + all logic, self-contained)
├── manifest.json  ← PWA config
└── sw.js          ← Offline service worker
```

> All JavaScript is inside `index.html` — no separate files needed.
