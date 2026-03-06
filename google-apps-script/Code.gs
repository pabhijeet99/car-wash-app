// =============================================
// CAR WASH MANAGER — Master Google Apps Script
// Deploy this ONCE. All clients share this URL.
// Each client gets their own Google Sheet
// automatically created on first registration.
// =============================================

// (Optional) Your own spreadsheet ID to track all registered clients
// Create a blank Google Sheet, copy its ID here to log all clients
// Leave empty '' if you don't want client tracking
var MASTER_LOG_ID = '';

// =============================================
// MAIN REQUEST HANDLER
// =============================================
function doGet(e) {
  var action = e.parameter.action;
  var result;

  try {
    if (action === 'register') {
      result = registerNewClient(e.parameter);
    } else if (action === 'add') {
      result = addRecord(e.parameter);
    } else if (action === 'search') {
      result = searchRecords(e.parameter);
    } else {
      result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================
// REGISTER NEW CLIENT
// Creates a new Google Sheet for the client
// Shares it with their email
// Returns the Sheet ID to the app
// =============================================
function registerNewClient(params) {
  var businessName = params.businessName || 'Car Wash';
  var ownerName    = params.ownerName    || '';
  var email        = params.email        || '';
  var phone        = params.phone        || '';

  // 1. Create a brand new Google Sheet in the script owner's Drive
  var ss    = SpreadsheetApp.create('Car Wash Records - ' + businessName);
  var sheet = ss.getActiveSheet();
  sheet.setName('Visits');

  // 2. Add headers with formatting
  var headers = [
    'Date & Time', 'Customer Name', 'Phone',
    'Vehicle Number', 'Vehicle Model', 'Service Type',
    'Amount (₹)', 'Staff Name', 'Notes'
  ];
  sheet.appendRow(headers);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1565C0');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('CENTER');
  sheet.setFrozenRows(1);

  // Set column widths
  var widths = [150, 180, 130, 140, 140, 170, 100, 130, 200];
  widths.forEach(function(w, i) {
    sheet.setColumnWidth(i + 1, w);
  });

  // 3. Share sheet with client's email (they get edit access)
  if (email && email.indexOf('@') !== -1) {
    try {
      ss.addEditor(email);
    } catch (e) {
      // Email sharing failed — not critical, continue
    }
  }

  // 4. Log this client in the master tracking sheet (optional)
  if (MASTER_LOG_ID) {
    try {
      var masterSS    = SpreadsheetApp.openById(MASTER_LOG_ID);
      var masterSheet = masterSS.getSheetByName('Clients');
      if (!masterSheet) {
        masterSheet = masterSS.insertSheet('Clients');
        masterSheet.appendRow([
          'Registration Date', 'Business Name', 'Owner Name',
          'Email', 'Phone', 'Sheet ID', 'Sheet URL'
        ]);
        masterSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1565C0').setFontColor('#FFFFFF');
      }
      masterSheet.appendRow([
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm'),
        businessName,
        ownerName,
        email,
        phone,
        ss.getId(),
        ss.getUrl()
      ]);
    } catch (e) {
      // Master logging failed — not critical
    }
  }

  return {
    success:  true,
    sheetId:  ss.getId(),
    sheetUrl: ss.getUrl(),
    message:  'Google Sheet created successfully for ' + businessName
  };
}

// =============================================
// ADD A VISIT RECORD
// =============================================
function addRecord(params) {
  var sheetId = params.sheetId;
  if (!sheetId) return { error: 'sheetId is required' };

  var ss    = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Visits');

  if (!sheet) {
    // Auto-recover: recreate Visits sheet if missing
    sheet = ss.insertSheet('Visits');
    sheet.appendRow(['Date & Time', 'Customer Name', 'Phone', 'Vehicle Number', 'Vehicle Model', 'Service Type', 'Amount (₹)', 'Staff Name', 'Notes']);
  }

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm');

  sheet.appendRow([
    now,
    params.customerName || '',
    params.phone        || '',
    (params.vehicleNumber || '').toUpperCase(),
    params.vehicleModel  || '',
    params.serviceType   || '',
    params.amount        || '',
    params.staffName     || '',
    params.notes         || ''
  ]);

  return { success: true, message: 'Record saved' };
}

// =============================================
// SEARCH RECORDS
// =============================================
function searchRecords(params) {
  var sheetId = params.sheetId;
  var query   = params.query || '';
  var type    = params.type  || 'phone';

  if (!sheetId) return { error: 'sheetId is required' };
  if (!query)   return [];

  var ss    = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Visits');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data     = sheet.getDataRange().getValues();
  var colIndex = (type === 'vehicle') ? 3 : 2;
  var q        = query.toString().toLowerCase().trim();
  var results  = [];

  for (var i = 1; i < data.length; i++) {
    var cellVal = (data[i][colIndex] || '').toString().toLowerCase();
    if (cellVal.indexOf(q) !== -1) {
      results.push({
        date:          data[i][0].toString(),
        customerName:  data[i][1].toString(),
        phone:         data[i][2].toString(),
        vehicleNumber: data[i][3].toString(),
        vehicleModel:  data[i][4].toString(),
        serviceType:   data[i][5].toString(),
        amount:        data[i][6].toString(),
        staffName:     data[i][7].toString(),
        notes:         data[i][8].toString()
      });
    }
  }

  return results;
}
