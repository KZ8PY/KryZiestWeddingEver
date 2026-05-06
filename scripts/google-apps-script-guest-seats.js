/**
 * ZK-Wedding-GuestSeats-API - Dedicated Google Apps Script backend
 *
 * IMPORTANT:
 * - Deploy this as a separate Apps Script web app project
 * - Bind it to a separate Google Sheet used only for guest seats
 * - Do not mix this with the RSVP backend project/sheet
 *
 * SHEET STRUCTURE (GuestSeats sheet):
 * A: Guest Name
 * B: Table Name / Number
 * C: Optional image URL/path for highlighted table layout
 *
 * Header row is row 1. Data starts at row 2.
 */

var SEAT_SHEET_NAME = 'GuestSeats';
var MAX_SUGGESTIONS = 8;

/**
 * Supported actions:
 * - GET ?action=suggest&q=<partial name>
 * - GET ?action=find&name=<guest name>
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = (params.action || '').toLowerCase();

    if (action === 'suggest') {
      var query = (params.q || '').toString();
      var suggestions = getSeatSuggestions_(query, MAX_SUGGESTIONS);
      return jsonResponse_({
        status: 'success',
        action: 'suggest',
        suggestions: suggestions
      });
    }

    if (action === 'find') {
      var inputName = (params.name || '').toString().trim();

      if (!inputName) {
        return jsonResponse_({
          status: 'error',
          msg: 'missing-name'
        });
      }

      var match = findSeatByName_(inputName);
      if (!match) {
        return jsonResponse_({
          status: 'error',
          msg: 'not-found',
          notFound: inputName
        });
      }

      return jsonResponse_({
        status: 'success',
        action: 'find',
        guestName: match.name,
        tableName: match.table,
        layoutImage: match.layoutImage || ''
      });
    }

    if (action === 'health') {
      return jsonResponse_({ status: 'success', action: 'health' });
    }

    return jsonResponse_({
      status: 'error',
      msg: 'unknown-action',
      supported: ['suggest', 'find', 'health']
    });
  } catch (error) {
    return jsonResponse_({
      status: 'error',
      msg: 'server',
      detail: error.message
    });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeText_(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize_(value) {
  var normalized = normalizeText_(value);
  return normalized ? normalized.split(' ') : [];
}

function getSeatSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var seatSheet = ss.getSheetByName(SEAT_SHEET_NAME);
  return seatSheet || ss.getSheets()[0];
}

function getSeatDirectory_() {
  var sheet = getSeatSheet_();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  var rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var directory = [];

  for (var i = 0; i < rows.length; i++) {
    var name = (rows[i][0] || '').toString().trim();
    var table = (rows[i][1] || '').toString().trim();
    var layoutImage = (rows[i][2] || '').toString().trim();

    if (!name || !table) {
      continue;
    }

    directory.push({
      name: name,
      table: table,
      layoutImage: layoutImage,
      normalizedName: normalizeText_(name),
      tokens: tokenize_(name)
    });
  }

  return directory;
}

function getSeatSuggestions_(query, limit) {
  var normalizedQuery = normalizeText_(query);
  var directory = getSeatDirectory_();

  if (!normalizedQuery) {
    return directory.slice(0, limit).map(function(entry) {
      return {
        name: entry.name,
        table: entry.table
      };
    });
  }

  var queryTokens = tokenize_(normalizedQuery);

  var scored = directory
    .map(function(entry) {
      var score = 0;

      if (entry.normalizedName.indexOf(normalizedQuery) === 0) {
        score += 120;
      } else if (entry.normalizedName.indexOf(normalizedQuery) > -1) {
        score += 80;
      }

      for (var i = 0; i < queryTokens.length; i++) {
        if (entry.tokens.indexOf(queryTokens[i]) > -1) {
          score += 20;
        }
      }

      return {
        entry: entry,
        score: score
      };
    })
    .filter(function(item) {
      return item.score > 0;
    })
    .sort(function(a, b) {
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(function(item) {
      return {
        name: item.entry.name,
        table: item.entry.table
      };
    });

  return scored;
}

function findSeatByName_(inputName) {
  var normalizedInput = normalizeText_(inputName);
  var inputTokens = tokenize_(normalizedInput);
  var directory = getSeatDirectory_();

  if (!normalizedInput || directory.length === 0) {
    return null;
  }

  for (var i = 0; i < directory.length; i++) {
    if (directory[i].normalizedName === normalizedInput) {
      return directory[i];
    }
  }

  var best = null;
  var bestScore = 0;

  for (var j = 0; j < directory.length; j++) {
    var candidate = directory[j];
    var score = 0;

    if (candidate.normalizedName.indexOf(normalizedInput) === 0) {
      score += 100;
    } else if (candidate.normalizedName.indexOf(normalizedInput) > -1) {
      score += 70;
    }

    for (var t = 0; t < inputTokens.length; t++) {
      if (candidate.tokens.indexOf(inputTokens[t]) > -1) {
        score += 25;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore > 0 ? best : null;
}
