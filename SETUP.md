# Car Wash Manager — Complete Setup Guide

## What You Need (Free)
- A GitHub account (free) → to host the app
- A Google account → each client uses their own

---

## PART 1 — Deploy the App (5 minutes)

### Step 1: Create GitHub Repository
1. Go to **github.com** → sign in → click **+** → **New repository**
2. Name: `car-wash-app` | Visibility: **Public** | Click **Create**

### Step 2: Upload Files
On the new repo page, click **"uploading an existing file"** and upload:
- `index.html`
- `manifest.json`  
- `sw.js`

Then click **Commit changes**.

### Step 3: Enable GitHub Pages
1. Go to repo **Settings** → **Pages**
2. Source: **Deploy from a branch** → Branch: **main** → `/root`
3. Click **Save**

✅ App is now live at:
```
https://YOUR_GITHUB_USERNAME.github.io/car-wash-app
```
(Wait 2–3 minutes for first deployment)

---

## PART 2 — Google Cloud Setup (10 minutes, one-time)

This is needed so the app can create Google Sheets.  
You only do this ONCE. All your clients use the same Client ID.

### Step 1: Create Project
1. Go to **console.cloud.google.com**
2. Click **Select a project** → **New Project**
3. Name: `Car Wash Manager` → **Create**

### Step 2: Enable APIs
1. Go to **APIs & Services → Library**
2. Search for **Google Sheets API** → Enable
3. Search for **Google Drive API** → Enable

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. User type: **External** → **Create**
3. App name: `Car Wash Manager`
4. User support email: your Gmail
5. Developer contact: your Gmail
6. Click **Save and Continue** through all steps
7. Back on consent screen page → Click **Publish App** → **Confirm**

### Step 4: Create OAuth Client ID
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Car Wash Manager`
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   ```
   https://YOUR_GITHUB_USERNAME.github.io
   ```
6. Click **Create**
7. A popup shows your **Client ID** — copy it (looks like `123456789-abcdef.apps.googleusercontent.com`)

---

## PART 3 — First Open on Phone

1. Open Chrome → go to `https://YOUR_USERNAME.github.io/car-wash-app`
2. The app shows a **"One-time Setup"** screen
3. Paste your **Client ID** → tap **Save & Continue**
4. Tap **Sign in with Google** → choose their Gmail account
5. ✅ The app automatically creates **"Car Wash Data"** sheet in their Drive
6. Set a PIN for quick access

### Install on Home Screen
**Android (Chrome):** Tap ⋮ menu → **Add to Home Screen** → Add  
**iPhone (Safari):** Tap Share → **Add to Home Screen**

---

## HOW MULTIPLE CLIENTS WORK

Each client:
1. Opens the same URL
2. Signs in with **their own Google account**
3. Gets **their own "Car Wash Data" sheet** created in **their own Drive**
4. Their data is completely separate from other clients

```
Client A (Gmail: a@gmail.com) → "Car Wash Data" in A's Drive
Client B (Gmail: b@gmail.com) → "Car Wash Data" in B's Drive
Client C (Gmail: c@gmail.com) → "Car Wash Data" in C's Drive
```

Nobody can see anyone else's data. You only set up the Client ID once.

---

## DATA SHEET FORMAT

Sheet name: **"Car Wash Data"**

| Column | Content |
|--------|---------|
| A | Date & Time |
| B | Customer Name |
| C | Phone |
| D | Vehicle No. |
| E | Vehicle Model |
| F | Service Type |
| G | Amount (₹) |
| H | Staff |
| I | Notes |

---

## TROUBLESHOOTING

**"Error: not_allowed_js_origin"**  
→ Your site URL is not in the Authorized JavaScript Origins.  
→ Go to Google Cloud → Credentials → edit your Client ID → add the URL.

**"Exception: You do not have permission"**  
→ This was the old Apps Script error. This version does NOT use Apps Script.  
→ Just sign in with Google — the sheet is created in your own Drive automatically.

**"Sign in with Google" button does nothing**  
→ Wait 5 seconds for the Google script to load, then try again.  
→ Check that you entered the Client ID correctly.

**Session expired / needs to sign in again**  
→ Google tokens expire after ~1 hour. The app auto-refreshes silently.  
→ If it fails, tap "Switch account / Sign in again" on the PIN screen.

**Want to change Google account**  
→ Settings → Sign Out & Switch Account

---

## APP FEATURES

- ✅ Google Sign In — each client uses their own account
- ✅ Auto-creates **"Car Wash Data"** sheet in Google Drive  
- ✅ Saves every entry to Google Sheets in real-time
- ✅ Local cache — app works even if internet is slow
- ✅ PIN lock for quick re-open by staff
- ✅ 5 KPI cards on home screen
- ✅ Analytics: service breakdown + 7-day revenue chart
- ✅ Search by phone number or vehicle number
- ✅ Export to CSV
- ✅ Installable as PWA (works like a native app)
