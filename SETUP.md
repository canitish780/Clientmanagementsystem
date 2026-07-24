# Setup — Client Management System

## 1. Backend (Google Apps Script)

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1OG1Ha3NArrZCUcahAQooeU495prhhQXdTWJLoIv62W8/edit
2. Extensions → Apps Script.
3. Delete any existing code in `Code.gs`, paste in the contents of the `Code.gs` file provided.
4. Click **Save**.
5. In the function dropdown (top toolbar), select `initAll`, click **Run**. This creates all sheet tabs (GST, ITR, LOAN, MISC + entry tabs) and the four category folders inside your Drive folder. The first run will ask you to authorize — allow it (it needs access to this Sheet and your Drive).
6. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
7. Copy the Web App URL it gives you. It should match the one already in `app.js` (`WEBAPP_URL`). If it's different (e.g. you redeploy later and get a new URL), update `WEBAPP_URL` in `app.js` accordingly.

**Important:** every time you edit `Code.gs` later, you must go to **Deploy → Manage deployments → Edit (pencil) → New version → Deploy** for the changes to go live. Just saving the script is not enough.

## 2. Frontend (GitHub Pages)

Your repo: https://github.com/canitish780/Clientmanagementsystem

1. Add these three files to the **root** of the repo (replacing anything already there):
   - `index.html`
   - `style.css`
   - `app.js`
2. Commit and push.
3. In repo Settings → Pages, make sure the source is set to the `main` branch, root folder.
4. Visit https://canitish780.github.io/Clientmanagementsystem/ (may take a minute after pushing).

## 3. Notes

- A one-time device passphrase gate has been added: **trusttheprocess**. Each new browser/device asks for it once, then remembers (via localStorage) and won't ask again on that device. Clearing browser data/site storage will make it ask again. This is a light deterrent, not real security — anyone who knows the phrase (or opens dev tools) can get in.
- The client list is cached locally (localStorage) so the page shows data instantly on repeat visits, then quietly re-syncs in the background. A small status dot near "+ New Client" shows: yellow pulsing = syncing, green = synced (with time), yellow solid = offline/showing saved data, red = sync failed. It also auto-retries when your connection comes back.
- **Data safety**: your existing data in the Sheet and Drive is untouched. The backend now always reads/writes columns by matching the sheet's actual header row (not a fixed order), and any new field is added as a new column at the end — so nothing gets overwritten, reordered, or misaligned, no matter how the script evolves later.
- **Offline-safe saving**: if you add/edit a client or add an entry while the connection drops, the app now saves it on your device and syncs automatically the moment you're back online (checked every ~60s, and instantly on reconnect). You'll see a "N change(s) waiting to sync" badge until it goes through. Don't clear your browser data while something is still pending sync.
- Search now matches against everything (name, client no., mobile, GSTIN, PAN, Aadhar, email, address, notes, etc.), not just name/mobile.
- GST and ITR now have an optional "Other Details" field on the client form.
- Return-filed documents are now saved into a folder named after the exact period you type/select (e.g. "July 2025" or the year you enter), inside that client's "Returns Filed" folder.

## 4. If you already have GST/ITR entries with a wrong-looking period (e.g. a date instead of "July 2025")

This was a Google Sheets quirk (it auto-converted period text into a date). It's now fixed going forward. To apply the fix to your existing sheet and clean up old rows:

1. Redeploy the updated `Code.gs` (see step 1 above — **you must create a New Version**, not just save).
2. Visit this URL once in your browser (replace with your actual web app URL): `YOUR_WEBAPP_URL?action=fixFormats` — this locks the Month/Year columns to plain text going forward.
3. For any already-affected rows, open the GST_Entries / ITR_Entries sheet and retype the Month/Year cell as plain text (e.g. "July 2025").
4. New entries you add from now on will save correctly and automatically get their own dated folder inside "Returns Filed".
- Client numbers auto-generate per category: `GST001`, `ITR001`, `LOAN001`, `MISC001`, and so on.
- Drive folder structure created automatically per client:
  ```
  My Clients/
    GST Clients/GST001 - Trade Name/Documents, /Returns Filed
    ITR Clients/ITR001 - Name/Documents, /Returns Filed
    Loan Clients/LOAN001 - Name/Documents
    Misc Clients/MISC001 - Name/Documents
  ```
- For GST and ITR clients, "+ Add Entry" in the popup lets you record the month/year data and upload that period's documents/return together in one step, saved to the "Returns Filed" folder.
- The "Client Documents" section in the popup is for anytime uploads (not tied to a specific month/year), saved to the "Documents" folder.
- If a save/upload fails, double check step 6 above — the deployment must be set to "Anyone" access, and any script edits need a new deployed version.
