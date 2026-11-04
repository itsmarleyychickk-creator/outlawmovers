# McCracken County customer workflow

In the private office, open **County job workflow**, add/select a customer and job, then save the first step to attach a checklist. **Jobs & quotes → County checklist** opens a specific job. A separate workflow belongs to each job, so additional projects for the same customer do not share approvals.

The screen shows the next unresolved step, before-work blockers, responsible employee, next due date, source-specific answers, evidence references, private attachments and a printable preparation copy. **Save step & show next** saves the answers and selects the next unresolved step. **Save & create / update follow-up** also adds or updates that step’s assignment in Follow-ups / Departments. No automatic emails, agency submissions, payment, signatures or external status synchronization occurs.

Confirm the actual jurisdiction; a Paducah postal address is not proof of city limits. County Cloudpermit and the city process are distinct. Source links were reviewed November 4, 2026. Older county planning forms are reference copies; the current portal and reviewer determine required documents and fees. Conditional items need a documented not-applicable basis, not an assumed exemption.

The office readiness step requires earlier reviews and a current job-specific 811 ticket (or documented non-excavation basis for both locate steps). Record the legal start and expiration from the ticket with explicit timezone offsets. Never derive a legal dig date by adding calendar days. Verify operator responses, private utilities and field conditions before each excavation session. The app recalculates ticket validity when the workflow is opened/saved; it does not monitor while closed or grant permission to dig. It does not enforce county readiness through other job editors.

Existing customer records, financial amounts and public job status are preserved. The workflow is stored within private job records and attachments use the existing authenticated evidence API. Existing staff authorization remains unchanged. The workflow does not add offline storage of sensitive records; internet is needed to save, and a printed private preparation copy can be used in the field.

## Official sources

- https://mccrackencountyky.gov/inspection-department-2/
- https://mccrackencountyky.gov/planning-zoning/
- https://mccrackencountyky.gov/road-department/
- https://kentucky811.org/process/
- https://kentucky811.org/
- https://paducahky.gov/permitting-and-licensing-guide

## Validation

`node --test test/county-workflow.test.js` covers preparation versus issuance, unresolved prerequisites, conditional exemptions, ticket timing/expiry, and closeout dependencies. No live permit applications are submitted by tests.

## Email forms from a job

Expand **Email forms to this customer / owner**. Choose landowner, home-owner, scope clarification or general request text; confirm the recipient and select only the intended documents. The customer email is prefilled privately; another owner’s address must be entered after confirmation. No marital status or authority is inferred.

**Open Gmail draft** and **Open email app** prefill the message. Download selected attachments and attach them there before sending. **Email file with attachments (.eml)** creates a MIME draft with document bytes for compatible desktop mail clients. **Share message & files** uses the device share sheet when supported; confirm the actual recipient in the chosen app. Provider sending credentials are not stored by this feature and no provider-send API is called.

Unsent drafts save in Customer service. Record actual sending separately using a date, reference and explicit confirmation; this remains self-reported. Delivery and signatures are not verified automatically. Upload signed returns and review them before resolving permission steps. Never email private authenticated document links as if they were recipient-accessible attachments. The form-email panel requires a connection to load private document bytes and save history.
