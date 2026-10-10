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
