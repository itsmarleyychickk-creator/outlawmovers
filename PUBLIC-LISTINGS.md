# Public sale listings

Edit docs/inventory.json to add only items explicitly approved for public sale. The homepage renders clickable cards and shareable #item=ID details. No private equipment records are copied automatically.

Each item supports: id (unique string), title, price (number in USD), category, status (Available, Pending or Sold), photos (array of assets/ paths or HTTPS URLs), description, condition, makeModel, year, specifications, knownIssues, included, location, pickup, paymentTerms. Put only public pickup area information online, not private addresses or title/identity documents. Draft status is not a privacy control: never commit private drafts. Remove an item from the file to remove its public listing. Photos must be approved public images. There is no customer checkout or inventory editor yet.
