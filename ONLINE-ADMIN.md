## Office expansion — October 14, 2026

The public footer has a Staff sign in link to `/office/login.html`. The business email has been authorized privately; create the account and confirm the email before first sign-in. No password is stored in source. HTTPS and Auth redirect configuration below still require live confirmation before relying on sign-in.

The private workspace includes Jobs & quotes for mobile-home transport, house moving, clearing/grading/site preparation, excavation/trenching, driveways, demolition and other work. Each job records scope, quote breakdown and total, quote validity, payments, employee/equipment assignment, dates, permit agency/status/deadline and internal notes. The Schedule view flags same-day assignment overlaps; it does not calculate shift availability. Pricing stores an internal rate sheet. Permits consolidates active job permit records. Delivered is displayed as Completed / delivered in the editor; the underlying status remains Delivered for existing task routing. Dispatched remains reserved for transport and retains company/paperwork checks.

Company rates, jobs and documents are not automatically published. Customer communications are saved logs/drafts; no automatic email/SMS sending, mailbox synchronization, payroll, permit filing or restricted employee permissions are implemented. Existing compliance worksheets remain transport focused; site-work legal requirements must be confirmed per jurisdiction. A printed job summary is not a signed contract or payment receipt.

# Free online administrator workspace

The online office is served by GitHub Pages at `/office/`. Supabase provides individual email/password authentication, private database records, and a private `office-documents` Storage bucket. No paid Node hosting is needed for this version. The original Node/SQLite app remains intact for local use; the Render blueprint below is optional and is not used by the online office.

## HTTPS prerequisite

The custom domain was observed redirecting the default Pages address to HTTP, and its HTTPS endpoint returned a certificate hostname mismatch. In GitHub **Settings → Pages**, confirm `outlawmoversllc.com`, finish the DNS check/certificate issuance, and enable **Enforce HTTPS**. The online office refuses to sign in over HTTP. No DNS or email records were changed by this integration. The deployment workflow succeeded, but real administrator login and document-download validation remain pending HTTPS setup and account creation.

## First administrator login

Open https://outlawmoversllc.com/office/login.html, create your authorized account with a password of at least 12 characters, confirm the email, then sign in. Only verified email accounts on the server-managed administrator allowlist can access records; ordinary signups have no office permissions. The allowlist is private, is not in Git, and cannot be changed by browser users. Administrator credentials must never be entered into source files or sent in chat.

In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://outlawmoversllc.com/office/` and add these exact redirect URLs:

- `https://outlawmoversllc.com/office/`
- `https://outlawmoversllc.com/office/login.html`

The connector does not expose URL-configuration controls. This dashboard setting is necessary for confirmation and password-reset links to return to the correct website. Until it is set, an email may confirm the account and redirect to the default localhost page; reopen the office login afterward.

## Data, files and preservation

Customers, jobs, employees, equipment, department tasks, income, expenses, compliance worksheets and saved forms are private Supabase records. Documents are private Storage objects, retrieved using an authorized session. There is no service-role or secret key in GitHub Pages. The frontend publishable key is intentionally public; row-level security enforces access on every office table. The Edge Function validates the bearer token against Supabase Auth and independently checks the verified administrator allowlist for every request; its gateway JWT check is disabled to support publishable keys and preflight requests.

The online database is separate from existing SQLite records. Existing private files and records were not available in the public repository and were not imported or overwritten. Do not delete local data. A private migration must transfer records, document bytes and archived packet versions before the online workspace can replace that existing dataset. Do not upload SQLite, exported business records, or packet PDFs to GitHub.

Use **Filing documents → Upload source packet** to upload the original 71-page-or-longer transport packet privately. This activates the existing PDF editor and government form page groups. Packet upload alone does not import SQLite records or fill worksheet answers. Saved forms keep a content-hash reference to their original packet, even after the current packet is replaced. Review the source edition, signatures and filing instructions; downloads are not agency submissions.

Record edits and automatic department handoffs commit together. Worksheet version checks reject stale edits. Permanent deletion is disabled online. Uploaded documents are immutable. History is stored in the database; the office display and JSON export include only the latest 1000 history events. JSON exports do not include file bytes and are not full disaster-recovery backups. Free-tier off-machine backups and a restore test remain necessary before relying on this for the only copy of business records.

Renewal reminders appear in the office when opened; ICS download is available. No automatic email/SMS deadline reminders, customer tracking portal, payroll processing, or agency submission is connected. All approved accounts currently have administrator access; restricted employee permissions are not implemented.

## Rebuild and deployment

Run `npm ci`, `npm run build:online`, and `npm test`. The build copies the existing office modules to `docs/office/` and bundles the pinned Supabase client. Commit only source code and static assets. `online/schema.sql` documents the applied schema; do not reapply it to an existing database. The Edge Function source uses the shared root `compliance.js` and `forms.js`; include these plus the pinned `deno.json` imports when deploying. GitHub Pages continues serving `docs/`, including the public website and online office shell. Keep apex/www DNS and company email records intact.

The configured project is on the free organization plan. No hosting purchase or paid branch was created. Free service limits still apply; review usage before uploading large archives.

---

## Previous local/server hosting instructions

# Online private administrator workspace

The app has a private `/admin` route, eight-hour login sessions, login-attempt limiting and HTTPS secure cookies when `PUBLIC_ORIGIN` is configured. Business information is returned only after office authentication. A password-protected page on GitHub Pages cannot execute this backend or store its private database.

No online hosting has been purchased or deployed. The optional `render.yaml` blueprint is a **paid** Node.js web service with a 1 GB persistent disk. Render's pricing page checked October 10, 2026 lists Starter at $7/month and persistent disks at $0.25/GB/month: about $7.25/month for this configuration before taxes or additional usage. Review the checkout total before creating it: https://render.com/pricing. Do not select a free ephemeral filesystem for permanent employee or financial records. There are other hosting options; this blueprint does not obligate a purchase.

## Required provider setup

1. Connect the existing GitHub repository to a Node.js 24+ hosting service with persistent private storage.
2. Build with `npm ci`; start with `npm start`. Test `/login` readiness.
3. Store private data on the persistent disk, using `APP_DATA_DIR`. `DATABASE_PATH` and `TRANSPORT_PACKET_PATH` are optional overrides.
4. Set `NODE_ENV=production`, `HOST=0.0.0.0`, a unique `OFFICE_PASSWORD` of at least 20 characters in the provider's secret settings, and `PUBLIC_ORIGIN` to the exact HTTPS origin (no trailing slash). Production refuses to start without these. Do not put a password in Git, chat or public files.
5. Provision an HTTPS domain such as `office.outlawmoversllc.com` using the provider's actual DNS target and certificate instructions. This is a separate subdomain: preserve apex/www website records and all email MX/TXT records. Do not guess a DNS target before the service exists.
6. Confirm authentication, a representative saved record and PDF download, source privacy, logout, and restart persistence over the real HTTPS endpoint.
7. Transfer the existing private SQLite database/source packet to the persistent storage using an authenticated secure transfer, or upload the packet through **Filing documents → Upload source packet** and enter/import the business information. Uploading a packet alone does not migrate the existing database or prefill new worksheets. Never put the supplied PDF or customer database in the public repository.
8. Arrange off-machine database backups and a restore test before business use. The Windows launcher's daily backup does not run in online service mode.
9. After verification, add an **Administrator login** link on the public website to the verified office URL. Do not publish a broken or insecure login placeholder.

The initial office uses one shared administrator password. Per-user roles, MFA, account recovery and password rotation tools are not implemented; staff must not share one login if separate access permissions are needed. Hosting this version does not establish a full enterprise security review. Production credentials, persistence, backups and live HTTPS validation remain prerequisites.

## Fill, save, print and submit

Open **Filing documents** after staff login. Thirteen packet form groups include KYTC carrier credentials, IRP schedules, CDL self-certification, clearance, new-hire records, W-4/K-4/I-9/W-9, Form 2290 and personal-property forms. These use the packet's original editions, not automatically updated government downloads.

Choose a page and click a field location, then type an answer. Save the document draft. Unknown answers can stay blank. Draft versions and an archived source-packet hash are saved privately. Existing drafts retain their original PDF source when the packet is replaced. Download the filled PDF and review page positioning, form edition, applicability, required signature/certification and filing instructions. Print the downloaded PDF or use the official portal's accepted upload method. The app does not mail, sign, certify, or submit a government filing.

Record **Submitted** with an actual submission date and receipt/reference; record **Accepted** only after agency confirmation. Save the actual receipt in the associated setup record's evidence section. Agency portals can require direct entry rather than PDF upload. Use their current instructions, not a presumed universal mailing address or submission method. Forms relying on tax year, eligibility or licensing must be reviewed by the responsible person.
