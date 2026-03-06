// =============================================
// CAR WASH MANAGER — Google Sheets API
// Uses one master Apps Script URL.
// Each client gets their own Sheet ID on register.
// =============================================

// =============================================
// 👉 DEVELOPER: Paste your Master Script URL here
//    (Deploy Code.gs ONCE — all clients use this)
// =============================================
const MASTER_URL = 'https://script.google.com/macros/s/AKfycbzBEv95yIFn78lz8LE8VHzt9LAGg5uZNcANyaaAKFsO8zHbInkUeHDHv-4Y_5fcq78F/exec';

// =============================================
const SHEETS = {

  getMasterUrl() {
    return MASTER_URL;
  },

  getSheetId() {
    return localStorage.getItem('cw_sheet_id') || '';
  },

  saveSheetId(id) {
    localStorage.setItem('cw_sheet_id', id);
  },

  // ---- REGISTER: Auto-creates Google Sheet for new client ----
  async register(profile) {
    const url = this.getMasterUrl();
    if (!url || url === 'YOUR_MASTER_SCRIPT_URL_HERE') {
      throw new Error('Master script URL not configured. See SETUP.md.');
    }

    const params = new URLSearchParams({
      action:       'register',
      businessName: profile.businessName || '',
      ownerName:    profile.ownerName    || '',
      email:        profile.email        || '',
      phone:        profile.phone        || ''
    });

    const res  = await fetch(url + '?' + params.toString());
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Registration failed');

    // Save the new Sheet ID for all future operations
    this.saveSheetId(data.sheetId);

    return data; // { success, sheetId, sheetUrl, message }
  },

  // ---- ADD a new visit record ----
  async addRecord(record) {
    const url     = this.getMasterUrl();
    const sheetId = this.getSheetId();

    if (!url || url === 'YOUR_MASTER_SCRIPT_URL_HERE') {
      throw new Error('App not configured. Please contact support.');
    }
    if (!sheetId) {
      throw new Error('No sheet linked. Please re-register the app.');
    }

    const params = new URLSearchParams({
      action:        'add',
      sheetId,
      customerName:  record.customerName  || '',
      phone:         record.phone         || '',
      vehicleNumber: (record.vehicleNumber || '').toUpperCase(),
      vehicleModel:  record.vehicleModel  || '',
      serviceType:   record.serviceType   || '',
      amount:        record.amount        || '',
      staffName:     record.staffName     || '',
      notes:         record.notes         || ''
    });

    const res  = await fetch(url + '?' + params.toString());
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Failed to save record');
    return data;
  },

  // ---- SEARCH records ----
  async search(query, type) {
    const url     = this.getMasterUrl();
    const sheetId = this.getSheetId();

    if (!url || url === 'YOUR_MASTER_SCRIPT_URL_HERE') {
      throw new Error('App not configured. Please contact support.');
    }
    if (!sheetId) {
      throw new Error('No sheet linked. Please re-register the app.');
    }

    const params = new URLSearchParams({
      action: 'search',
      sheetId,
      query:  query.trim(),
      type
    });

    const res  = await fetch(url + '?' + params.toString());
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return Array.isArray(data) ? data : [];
  }
};
