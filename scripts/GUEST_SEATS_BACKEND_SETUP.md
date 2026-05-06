# Guest Seats API Setup (Separate Sheet + Separate Apps Script)

This keeps your current RSVP API untouched.

## 1) Create a separate Google Sheet

Create a new spreadsheet (example name: `KZWedding-GuestSeats`).

Create a sheet tab named `GuestSeats` with columns:

- A: Guest Name
- B: Table Name / Number
- C: Optional layout image URL/path

Header row is row 1. Data starts at row 2.

Example:

| Guest Name     | Table | Layout Image                                          |
| -------------- | ----- | ----------------------------------------------------- |
| Juan Dela Cruz | 7     | /public/images/table-layouts/table-7-highlighted.webp |
| Maria Santos   | 3     | /public/images/table-layouts/table-3-highlighted.webp |

## 2) Create a separate Apps Script project

1. Go to script.google.com
2. Create `New project` (do not reuse RSVP project)
3. Name it `ZK-Wedding-GuestSeats-API`
4. Replace default code with content from [scripts/google-apps-script-guest-seats.js](scripts/google-apps-script-guest-seats.js)
5. Bind this script project to the new `KZWedding-GuestSeats` sheet

## 3) Deploy as Web App

1. Deploy -> New deployment
2. Type: `Web app`
3. Execute as: `Me`
4. Who has access: `Anyone`
5. Click `Deploy`
6. Copy the `/exec` URL

## 4) Update frontend URL

Open [src/js/guest-seats.js](src/js/guest-seats.js) and set:

```js
const SCRIPT_URL = "YOUR_NEW_GUEST_SEATS_WEB_APP_URL_HERE";
```

## 5) Quick test URLs

Use your deployed URL in browser:

- `.../exec?action=health`
- `.../exec?action=suggest&q=mar`
- `.../exec?action=find&name=Maria%20Santos`

Expected:

- `health` returns success JSON
- `suggest` returns matching names/tables
- `find` returns `{ guestName, tableName, layoutImage }`

## Notes

- Your existing RSVP backend file [scripts/google-apps-script-backend.js](scripts/google-apps-script-backend.js) remains RSVP-only.
- Guest Seats now has its own backend file [scripts/google-apps-script-guest-seats.js](scripts/google-apps-script-guest-seats.js).
