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
    // Parse the incoming POST data
    var data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.from || !data.message) {
      return ContentService.createTextOutput(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: from or message'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the active spreadsheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = 'Messages';
    
    // Try to get the sheet, create if it doesn't exist
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Add headers
      sheet.getRange(1, 1, 1, 3).setValues([['From', 'Message', 'Timestamp']]);
    }
    
    // Get the last row and append the new data
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;
    
    // Format timestamp to readable format
    var timestamp = new Date(data.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Append the new entry
    sheet.getRange(newRow, 1, 1, 3).setValues([
      [
        data.from,
        data.message,
        timestamp
      ]
    ]);
    
    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'success',
        message: 'Gift registry message added successfully',
        row: newRow
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: 'Server error: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
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
