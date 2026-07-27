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
- Dark mode: toggle via the 🌙/☀️ button in the top bar. Remembered per device.
- Desktop layout now fills the screen (up to a comfortable max width) instead of a narrow centered column.
- The GST monthly table's "Total Sales Value" field replaced "Taxable Value of Sales" (same underlying data column, just relabeled).
- The Documents column in the monthly/yearly table now shows a single "Files" link that opens that period's Drive folder directly, instead of separate file-by-file links.

## 5. This update: PWA (installable + offline), a proper logo, and Reminders

**New files — all must be pushed to the repo root alongside index.html:**
`manifest.json`, `sw.js`, `icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-64.png`.

- **Installable app**: on Android Chrome you'll get an "Install app" prompt (or use the browser menu → "Add to Home screen"); on iPhone use Safari's Share → "Add to Home Screen". It'll open full-screen with its own icon, no browser bar.
- **Offline**: the app shell (the page itself) is cached by a service worker, so it opens even with zero connection. Adding/editing clients or entries while offline is queued **in IndexedDB on your device** (much bigger storage capacity than before — important for document uploads) and syncs automatically the moment you're back online, checked instantly on reconnect and every ~60s while the app is open.
  - **Honest limitation**: this protects you reliably whenever you reopen the app after being offline. It does *not* sync in the background while the app/tab is fully closed and your phone has no connection (that needs a different browser API with poor/no support on iPhone) — in practice this just means: reconnect and open the app once, and everything queued will sync within seconds.
- **Logo**: replaced the "§" placeholder with a simple ledger-mark icon (three bars in a circle), used both in the header and as the installed app icon.
- **Reminders** (🔔 icon next to dark mode, top right): shows anything due in the next 7 days —
  - ITR client birthdays (from Birth Date)
  - GST return filing (recurring, based on Filing Frequency — see the due-day constants at the top of `Code.gs`: `GST_MONTHLY_DUE_DAY`, `GST_QUARTERLY_DUE_DAY`/`GST_QUARTERLY_DUE_MONTHS` — **these are approximations**, since exact statutory due dates vary by state/scheme and change over time; adjust the numbers at the top of the script whenever needed)
  - ITR return filing (recurring annually — `ITR_DUE_MONTH`/`ITR_DUE_DAY`, also adjust if the government extends the deadline)
  - Any custom reminder you add for a specific client or a general note (e.g. payment follow-ups)
  - Each reminder has **Mark Done**, **Message** (opens your phone's SMS app), and **Call** (dials them) — the latter two only appear if a mobile number is on file.
  - "Mark Done" is remembered per occurrence (e.g. marking July's GST reminder done won't hide August's).

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
