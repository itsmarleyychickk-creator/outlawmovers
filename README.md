# Outlaw Movers office & customer care

A working office-management application for mobile-home transport, built from the supplied Outlaw Movers transport-only packet. Node.js 24 or newer; pinned PDF dependencies and no application build step.

## Run

```sh
cd /workspace/outlawmovers
npm ci
npm test
npm start
```

The service binds to `127.0.0.1:3000`. Office: `/`; customer quote intake: `/customer`. Read the generated office password locally from `data/office-password.txt`, or set `OFFICE_PASSWORD` securely before startup. Never commit the password. Login sessions reset when the server restarts. Set `PORT` to change the port. `DATABASE_PATH` can override the database location.

## Office workflow

- Add customers, contact details, and notes; search the directory.
- Create inquiries, quotes and transport jobs with pickup/delivery addresses, home dimensions, dates, assigned driver, permit references, quote and recorded payments.
- Follow the Inquiry → Quoted → Scheduled → Dispatched → Delivered workflow (or Cancelled).
- Record paperwork completion and company verification. Dispatch requires seven pre-dispatch checks and company standing/authority/insurance marked verified by staff.
- Log customer calls, emails and texts; drafts are **not sent**.
- Assign dated follow-ups, complete/reopen tasks, and review overdue work.
- Print transport summaries, export jobs as CSV, export office records as JSON, and open the supplied PDF.
- Copy a private customer link from a job. Links expose only that job's public status, addresses, planned date, unit, quote, recorded payments and customer-facing update. They do not expose internal office notes or other customers.

## Customer workflow

Customers submit their contact information and transport route at `/customer`. A request creates an inquiry and a private tracking link. Customers see updates there, submit messages directly to the office log, and contact the office by phone or email. Keep links private: anyone possessing a link can view its job summary. No online payments are processed.

## Data and scope

SQLite persists records in `data/office.sqlite` (ignored by Git). Back up the entire `data` folder while the service is stopped to preserve records and tracking links; JSON/CSV exports are supplemental, not an automatic restore feature. The supplied PDF is retained in `data/transport-packet.pdf`, accessible only after office login. Contacts are imported from the PDF; all company verification starts pending because the packet contains conflicting/unverified records. Sensitive tax and policy identifiers were not copied into the company profile. The app records staff decisions; it does not verify agency records or grant transport authority.

This is a local working application, not a publicly deployed service. Before public access, configure HTTPS hosting, stronger account management, credential rotation, request rate limiting and reliable backups. Use the app's default loopback binding for local development. The office currently uses one shared password rather than individual staff roles. Emails, texts, payment collection, calendar sync, file uploads and digital signatures are not connected. The transport summary is not a signed contract. Transport only; installation, blocking, anchoring, utilities and site work are excluded.

## Validation

`npm test` exercises public quote intake, office authentication, tracking privacy, quoting, dispatch blocking, task/conversation updates, PDF access, cross-origin rejection and SQLite persistence after restart. UI checks can run against the local service with a browser.

## Public website and company email

The company contact email is **John.henry@outlawmoversllc.com**. The separate `docs/` site is prepared for free GitHub Pages hosting and the purchased Squarespace domain. See [GITHUB-PAGES.md](GITHUB-PAGES.md) for publication and DNS instructions. GitHub Pages serves the public contact website; the office database application still needs server hosting for online use.

## Business setup and everyday office work

The office opens on **Business setup**. Eighteen transport-only worksheets cover company standing, tax identity, local registration, carrier authority, insurer filings, UCR, fleet inspection, driver qualification, testing/Clearinghouse, IRP, IFTA/KIT, KYU, Form 2290, move permits, customer release records and conditional employee obligations. Each has source references, plain-language steps, editable unknown fields, official instruction links, attachments and printable preparation sheets. These sheets are not substitutes for agency applications. Completing a worksheet records a staff decision, not a government approval or filing.

- Draft edits autosave after a short pause; check the **Saved** indicator before leaving. **Save progress** saves and refreshes immediately. Concurrent edits are rejected rather than silently overwritten.
- Complete a record only after confirming applicability, all checklist steps, evidence and completion date. Record why an item does not apply in its evidence/notes.
- Use **Another record** for more drivers, trucks, tax periods or moves. **Start next renewal** retains prior versions and proposes a date only from your recorded repeat schedule. Confirm it against the agency notice before saving; policies and credentials keep their own actual expiration fields.
- Renewals appear inside the app based on confirmed dates and your chosen lead time. **Export renewal calendar** downloads an ICS file for a calendar application. The app does not send email/SMS reminders or monitor deadlines while it is closed.
- **Employees** stores contacts, roles, qualification dates and private documents. **Equipment** stores vehicles, availability, registration/inspection dates and needed repairs. Use matching driver/fleet setup worksheets to track their recurring compliance actions.
- **Finance** saves income and expenses with dates, categories, parties, payment methods, receipts and optional job links. The net summary is recorded income less recorded expenses; job profitability excludes unrecorded costs and accounting/tax adjustments. Quote amounts and manually recorded job deposits are not added to ledger income automatically.
- **Departments** routes task queues. Inquiry/quote acceptance goes to Customer Service; scheduling to Dispatch; dispatched moves to Operations; delivered moves to Finance. Compliance follow-ups, fleet repairs and transaction reviews route to their queues. Assign an employee and due date, then complete the task when done. These are internal handoffs, not external messages or agency submissions.
- Jobs support an assigned employee, equipment, planned date and pickup time. Assignments are planning records and do not check full availability or staffing conflicts automatically.
- Record edits and uploads have stored history. Documents are saved inside the SQLite database, available only after staff login. Evidence attachments support up to 10 MB. JSON exports include history and file metadata; a full private `data/` backup preserves document bytes and tracking links. Do not publish that directory.

To import the packet's known fields into **private local storage** without overwriting filled fields:

```sh
node scripts/import-packet.js data/transport-packet.pdf
```

Requires `pdftotext` on the machine running the import. Source identifiers/policy details are read from the private PDF and never embedded in tracked source code. Imported data remains unverified, with packet conflicts recorded in notes.

For a free local installation, install Node.js 24+ and run `scripts/start-office.bat` on Windows or `bash scripts/start-office.sh` on macOS/Linux. Sign in locally using the generated `data/office-password.txt`. Keep the private data folder and PDF together. An online multi-device deployment still needs a persistent server; GitHub Pages cannot run this workspace. There is one shared office password at present; individual staff login permissions, payroll processing, automatic outbound communications, payment processing and official agency filing integrations are not implemented.

### Windows launcher and local backup

After installing Node.js 24+, double-click `START-OFFICE.bat` in the extracted office folder. The launcher opens the login in your browser and the generated local password in Notepad, without printing it in logs. Keep the command window open. See `WINDOWS-START-HERE.txt`. A daily SQLite backup is made when you start the launcher if an existing database is present; the source PDF is copied to the local backup folder. Backups on the same computer do not protect against disk loss, so copy the office folder to a secure external backup regularly. The private Windows package retains saved office data and source PDF; it excludes the previous instance's password, generating a new local password at first start.

## Private administrator and actual PDF forms

Install the pinned PDF dependencies with `npm ci` before starting. The app's authenticated administrator entry is `/admin`. **Filing documents** opens actual form pages from the private source packet, supports click-to-place typed answers, versioned saved drafts, archived source versions and PDF downloads. It does not sign or submit a filing. See [ONLINE-ADMIN.md](ONLINE-ADMIN.md) for the online hosting prerequisites and filing workflow. An optional paid hosting blueprint is prepared in `render.yaml`; no service is provisioned by saving this file.
