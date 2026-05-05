/**
 * KZ Gift Registry API - Google Apps Script Backend
 * Stores gift registry messages in a Google Sheet
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to: https://script.google.com
 * 2. Create a new project
 * 3. Copy this entire file and paste it into the script editor
 * 4. Click: Deploy → New deployment
 * 5. Type: Web app
 * 6. Execute as: Me (or your Google account)
 * 7. Who has access: Anyone
 * 8. Click: Deploy
 * 9. Copy the Web App URL (it will look like https://script.google.com/macros/s/ABC123.../exec)
 * 10. Update the SCRIPT_URL in src/js/gift-registry.js with this URL
 * 11. In Apps Script: Project Settings -> Script properties, add:
 *     - BPI_ACCOUNT_NAME
 *     - BPI_ACCOUNT_NUMBER
 * 
 * SPREADSHEET STRUCTURE:
 * The script will look for a spreadsheet named "KZ Gift Registry" in your Google Drive
 * And will use/create a sheet named "Messages"
 * 
 * Sheet name: "Messages"
 * Column A: From
 * Column B: Message
 * Column C: Timestamp
 * 
 * The script also creates/uses:
 * Sheet name: "AccountDetailViews"
 * Columns: Timestamp, Bank, ClientId, UserAgent, PagePath, Result
 * 
 * USAGE:
 * The form will POST data in this format:
 * {
 *   "from": "John Doe",
 *   "message": "Thank you for this wonderful opportunity!",
 *   "timestamp": "2026-05-03T10:30:00.000Z"
 * }
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');

    if (data.action === 'getAccountDetails') {
      return handleAccountDetailsRequest(data);
    }

    // Validate required fields
    if (!data.from || !data.message) {
      return asJson({
        status: 'error',
        message: 'Missing required fields: from or message'
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Messages', [['From', 'Message', 'Timestamp']]);

    var newRow = sheet.getLastRow() + 1;
    var timestamp = new Date(data.timestamp || new Date().toISOString()).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    sheet.getRange(newRow, 1, 1, 3).setValues([[data.from, data.message, timestamp]]);

    return asJson({
      status: 'success',
      message: 'Gift registry message added successfully',
      row: newRow
    });
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return asJson({
      status: 'error',
      message: 'Server error: ' + error.toString()
    });
  }
}

function handleAccountDetailsRequest(data) {
  var bank = String(data.bank || '').toUpperCase();
  var clientId = String(data.clientId || '').trim();
  var userAgent = String(data.userAgent || '').slice(0, 200);
  var pagePath = String(data.pagePath || '').slice(0, 100);

  if (!bank) {
    return asJson({ status: 'error', message: 'Missing bank.' });
  }

  if (!clientId || clientId.length < 8) {
    return asJson({ status: 'error', message: 'Client validation failed.' });
  }

  var cache = CacheService.getScriptCache();
  var rateKey = 'acct:' + clientId + ':' + bank;
  if (cache.get(rateKey)) {
    return asJson({
      status: 'error',
      message: 'Please wait a few seconds before requesting account details again.'
    });
  }
  cache.put(rateKey, '1', 20);

  var props = PropertiesService.getScriptProperties();
  var accountName = props.getProperty(bank + '_ACCOUNT_NAME');
  var accountNumber = props.getProperty(bank + '_ACCOUNT_NUMBER');

  if (!accountName || !accountNumber) {
    logAccountLookup(bank, clientId, userAgent, pagePath, 'missing-config');
    return asJson({
      status: 'error',
      message: 'Bank details are not configured yet. Please try again later.'
    });
  }

  logAccountLookup(bank, clientId, userAgent, pagePath, 'success');
  return asJson({
    status: 'success',
    data: {
      bank: bank,
      accountName: accountName,
      accountNumber: accountNumber
    }
  });
}

function logAccountLookup(bank, clientId, userAgent, pagePath, result) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(
      ss,
      'AccountDetailViews',
      [['Timestamp', 'Bank', 'ClientId', 'UserAgent', 'PagePath', 'Result']]
    );

    sheet.appendRow([
      new Date(),
      bank,
      clientId,
      userAgent,
      pagePath,
      result
    ]);
  } catch (error) {
    Logger.log('Failed to log account lookup: ' + error.toString());
  }
}

function getOrCreateSheet(ss, sheetName, headerValues) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headerValues[0].length).setValues(headerValues);
  }
  return sheet;
}

function asJson(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - remove after confirming deployment works
 * Run this in the Apps Script editor to test the backend
 */
function testGiftRegistryBackend() {
  var testData = {
    from: 'Test User',
    message: 'This is a test message for the gift registry!',
    timestamp: new Date().toISOString()
  };
  
  var e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  var result = doPost(e);
  Logger.log('Test Result: ' + result.getContent());
}
