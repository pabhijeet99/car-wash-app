// =============================================
// CAR WASH MANAGER — Google Sheets API Wrapper
// =============================================
// Uses the signed-in user's OAuth token.
// A fresh Google Sheet is auto-created in the user's
// own Google Drive on their very first login.
// =============================================

const SHEETS = {
  token: null,
  spreadsheetId: null,
  BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

  // Reset on logout
  reset() {
    this.token = null;
    this.spreadsheetId = null;
  },

  // Shared fetch headers
  _headers() {
    return {
      'Authorization': 'Bearer ' + this.token,
      'Content-Type': 'application/json'
    };
  },

  // ---- INIT: find or create the user's spreadsheet ----
  async init(userEmail) {
    const key   = 'cw_sheet_' + userEmail;
    const saved = localStorage.getItem(key);

    if (saved) {
      this.spreadsheetId = saved;
      return false; // existing user
    }

    // First login: create a brand-new spreadsheet in their Drive
    await this._createSpreadsheet(userEmail);
    localStorage.setItem(key, this.spreadsheetId);
    return true; // new user
  },

  // ---- CREATE a new Google Sheet with headers ----
  async _createSpreadsheet(userEmail) {
    const headerValues = [
      'Date & Time', 'Customer Name', 'Phone',
      'Vehicle Number', 'Vehicle Model', 'Service Type',
      'Amount (₹)', 'Staff Name', 'Notes'
    ];

    // Build header row with blue background + white bold text
    const headerCells = headerValues.map(v => ({
      userEnteredValue: { stringValue: v },
      userEnteredFormat: {
        backgroundColor: { red: 0.0843, green: 0.3961, blue: 0.7529 },
        textFormat: {
          foregroundColor: { red: 1, green: 1, blue: 1 },
          bold: true
        },
        horizontalAlignment: 'CENTER'
      }
    }));

    const body = {
      properties: { title: 'Car Wash Records' },
      sheets: [{
        properties: {
          title: 'Visits',
          gridProperties: { frozenRowCount: 1 }  // freeze header
        },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{ values: headerCells }]
        }]
      }]
    };

    const res  = await fetch(this.BASE, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    this.spreadsheetId = data.spreadsheetId;

    // Widen columns so data is readable
    await this._formatColumns();
  },

  // ---- SET column widths ----
  async _formatColumns() {
    const widths = [150, 180, 130, 140, 140, 170, 100, 130, 200];
    const requests = widths.map((px, i) => ({
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: px },
        fields: 'pixelSize'
      }
    }));

    await fetch(`${this.BASE}/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ requests })
    });
  },

  // ---- ADD a new visit record ----
  async addRecord(record) {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const row = [
      dateStr,
      record.customerName  || '',
      record.phone         || '',
      (record.vehicleNumber || '').toUpperCase(),
      record.vehicleModel  || '',
      record.serviceType   || '',
      record.amount        || '',
      record.staffName     || '',
      record.notes         || ''
    ];

    const url = `${this.BASE}/${this.spreadsheetId}/values/Visits!A:I:append` +
                `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const res  = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ values: [row] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  },

  // ---- SEARCH records by phone or vehicle number ----
  async search(query, type) {
    const url = `${this.BASE}/${this.spreadsheetId}/values/Visits!A:I`;
    const res  = await fetch(url, { headers: this._headers() });
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);
    if (!data.values || data.values.length <= 1) return [];

    // Column indices: 0=Date, 1=Name, 2=Phone, 3=VehicleNo, ...
    const colIndex = (type === 'vehicle') ? 3 : 2;
    const q        = query.toLowerCase().trim();

    return data.values
      .slice(1) // skip header row
      .filter(row => (row[colIndex] || '').toLowerCase().includes(q))
      .map(row => ({
        date:          row[0] || '',
        customerName:  row[1] || '',
        phone:         row[2] || '',
        vehicleNumber: row[3] || '',
        vehicleModel:  row[4] || '',
        serviceType:   row[5] || '',
        amount:        row[6] || '',
        staffName:     row[7] || '',
        notes:         row[8] || ''
      }));
  }
};
