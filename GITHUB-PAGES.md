# Free public website on GitHub Pages

The `docs/` folder is the public website for **outlawmoversllc.com**, using **John.henry@outlawmoversllc.com**. The website is separate from the Node.js office application. GitHub Pages cannot execute `server.js` or SQLite: office login, saved customer records, job tracking and portal messages require server hosting. The public quote form prepares an email for the customer to send; it does not save or automatically send inquiries.

## Enable publication

1. Open the `itsmarleyychickk-creator/outlawmovers` repository on GitHub.
2. For GitHub Free, Pages normally requires a public repository. Review repository visibility before changing it. Never upload `data/`, the private transport PDF, passwords or customer records.
3. Under **Settings → Pages**, choose **GitHub Actions** as the source.
4. Under **Actions → Publish public website**, run the workflow on `main` (or push a change to `docs/`). The workflow publishes only `docs/`.
5. Under **Settings → Pages**, set the custom domain to `outlawmoversllc.com` and save. Wait for DNS verification, then enable **Enforce HTTPS** when available.

## Squarespace domain DNS

In Squarespace Domains, select `outlawmoversllc.com` → DNS settings. Preserve all email **MX**, **TXT**, **SPF**, **DKIM**, and **DMARC** records; changing website hosting does not require moving email. Review existing web records before replacing conflicting entries.

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | itsmarleyychickk-creator.github.io |

These are GitHub Pages IPv4 addresses. Compare with GitHub's current custom-domain documentation before making DNS changes: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

The workflow may fail until Pages is enabled or if the repository's plan/visibility does not support it. A successful push is not evidence that the website is published. Confirm the workflow completed, the Pages settings report the intended URL, and the live domain serves the site over HTTPS. DNS propagation and certificate issuance can take time.

## Local check

Serve only the site directory:

```sh
cd /workspace/outlawmovers
python3 -m http.server 8080 --bind 127.0.0.1 --directory docs
```

Test the responsive layout and confirm the quote form opens an email draft addressed to the company email. It also shows copyable inquiry text if no email handler opens.

## Private documents

The office packet is retained locally at `data/transport-packet.pdf`, ignored by Git. If moving the full office app to a server, transfer that PDF securely into the server's private data directory. The office server serves it only to authenticated staff. The public Pages artifact contains no PDF, database or password.
