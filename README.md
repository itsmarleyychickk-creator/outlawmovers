# Outlaw Movers office & customer care

A working office-management application for mobile-home transport, built from the supplied Outlaw Movers transport-only packet. Node.js 24 or newer; no npm dependencies or build step.

## Run

```sh
cd /workspace/outlawmovers
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
