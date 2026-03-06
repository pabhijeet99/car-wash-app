// =============================================
// CAR WASH MANAGER — Google Apps Script API
// No OAuth needed. Uses GET requests only.
// Works perfectly in Android WebView APK.
// =============================================

const SHEETS = {

  getUrl() {
    return localStorage.getItem('cw_api_url') || '';
  },

  // ---- ADD a new visit record ----
  async addRecord(record) {
    const url = this.getUrl();
    if (!url) throw new Error('Apps Script URL not configured. Go to Settings.');

    const params = new URLSearchParams({
      action:        'add',
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

  // ---- SEARCH records by phone or vehicle number ----
  async search(query, type) {
    const url = this.getUrl();
    if (!url) throw new Error('Apps Script URL not configured. Go to Settings.');

    const params = new URLSearchParams({
      action: 'search',
      query:  query.trim(),
      type:   type   // 'phone' or 'vehicle'
    });

    const res  = await fetch(url + '?' + params.toString());
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return Array.isArray(data) ? data : [];
  },

  // ---- TEST connection to Apps Script ----
  async testConnection() {
    const url = this.getUrl();
    if (!url) return false;
    try {
      const params = new URLSearchParams({ action: 'search', query: 'TEST', type: 'phone' });
      const res = await fetch(url + '?' + params.toString());
      const data = await res.json();
      return !data.error || data.error === undefined;
    } catch (e) {
      return false;
    }
  }
};
