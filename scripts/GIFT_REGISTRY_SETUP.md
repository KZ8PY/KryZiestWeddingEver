# Gift Registry Setup Guide

This guide will help you set up the Gift Registry page and deploy the Google Apps Script backend.

## Files Created

1. **`gift-registry/index.html`** - The gift registry page with QR codes for BPI and GoTyme
2. **`src/js/gift-registry.js`** - Frontend form handler
3. **`scripts/google-apps-script-gift-registry.js`** - Backend script for Google Apps Script

## Frontend Setup

The gift registry page is now accessible at: `gift-registry/`

Features:

- Two QR code panels: BPI (qc1) and GoTyme (qc2)
- Bank names displayed in Tan Pearl font
- Single form with Name and Message fields below QR codes
- Name field defaults to "Anonymous" if left blank
- Message field is required
- Submit button with brewing loading state (🍵)
- Success message: "We, Ziber&Krysha, are grateful for your generosity and love. Thank you, from the bottom of our hearts."
- Navigation link added to main page sidebar

## Backend Setup (Google Apps Script)

Follow these steps to deploy the backend:

### Step 1: Copy the Google Apps Script Code

The code is in: `scripts/google-apps-script-gift-registry.js`

### Step 2: Create a Google Apps Script Project

1. Go to https://script.google.com
2. Click "New project"
3. Name it "KZ Gift Registry API" (or any name you prefer)

### Step 3: Paste the Code

1. In the script editor, delete any default code
2. Copy the entire contents of `scripts/google-apps-script-gift-registry.js`
3. Paste it into the editor

### Step 4: Deploy the Script

1. Click the **"Deploy"** button (top right)
2. Select **"New deployment"**
3. In the dropdown, select **"Web app"**
4. Set **"Execute as"** to your Google account
5. Set **"Who has access"** to **"Anyone"**
6. Click **"Deploy"**
7. You'll see a deployment ID - copy the entire Web App URL
   - Format: `https://script.google.com/macros/s/ABC123XXXXX/exec`

### Step 5: Update the Frontend URL

1. Open `src/js/gift-registry.js`
2. Find the line: `const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';`
3. Replace `YOUR_SCRIPT_ID_HERE` with your actual script ID from Step 4

### Step 6: Create the Google Sheets Spreadsheet

The script will automatically create the sheet when the first submission comes in. However, you can manually create it for better organization:

1. Create a new Google Sheet named **"KZ Gift Registry"** in your Google Drive
2. The script will automatically add a "Messages" sheet with columns: `From`, `Message`, `Timestamp`

## Testing

To test the backend before going live:

1. In the Google Apps Script editor, find the `testGiftRegistryBackend()` function
2. Click the play button (▶) to run it
3. Check the logs (Ctrl+Enter) to see the result
4. Verify that data appears in your "KZ Gift Registry" spreadsheet under the "Messages" sheet

## How It Works

### Frontend Flow

1. User views QR codes for BPI and GoTyme
2. User enters their name (or leaves blank for "Anonymous")
3. User enters a gift message
4. User clicks "Submit"
5. JavaScript sends the data to the Google Apps Script backend
6. Loading state shows "Brewing... 🍵"
7. On success, displays gratitude message
8. Form resets

### Backend Flow

1. Google Apps Script receives the POST request
2. Parses the JSON data (from, message, timestamp)
3. Gets or creates the "Messages" sheet
4. Appends the entry to the sheet
5. Returns success/error response to frontend

## Data Storage

The "Messages" sheet will have entries like:

- **From**: "Anonymous" or the name provided by the user
- **Message**: The gift message/well-wishes
- **Timestamp**: Date and time of submission (US format)

All messages are stored in a single sheet regardless of which QR code the user scanned.

## Troubleshooting

### "Failed to fetch" or Network Error

- Make sure you're accessing the page through `http://localhost` or the live website
- File:// protocol will NOT work due to CORS
- Check that the SCRIPT_URL is correct in `src/js/gift-registry.js`

### Script not found

- Double-check that the deployment URL is correct
- Make sure the Web App deployment is still active

### Data not appearing in spreadsheet

1. Check that the spreadsheet "KZ Gift Registry" exists in your Google Drive
2. Verify the script has permission to access it
3. Try running the test function in the Apps Script editor

### "Please share a message for the couple"

- The message field is required
- The name can be blank (will become "Anonymous")

## Additional Notes

- QR codes are displayed from `public/images/gift/qc1.jpg` (BPI) and `public/images/gift/qc2.jpg` (GoTyme)
- Bank names use the Tan Pearl font for visual consistency
- Form styling matches your RSVP page design
- Mobile responsive design included
- All messages are stored in a single "Messages" sheet for centralized gift tracking
