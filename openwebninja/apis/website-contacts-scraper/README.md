# website-contacts-scraper

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/website_contacts_scraper.yaml

**Host:** `website-contacts-scraper.p.rapidapi.com`
**Notes:** No pagination. Accepts up to 20 domains per call via 'query' param (comma-separated).

## Endpoints

### GET /scrape-contacts
Scrape Contacts from Website

**Required:**
- `query` (string) Example: `wsgr.com`

**Optional:**
- `match_email_domain` (boolean, default: false) Example: `false`
- `external_matching` (boolean, default: false) Example: `false`

**Pagination:** none
**Response path:** `data` (one entry per domain)
**Key fields:** domain, query, emails (value, sources), phone_numbers (value, sources), facebook, instagram, tiktok, snapchat, twitter, linkedin, github, youtube, pinterest

---

### POST /website-url-by-keyword
Get Website by Keyword — Get company website URL by keyword / company name. Up to 20 keywords per request. Use it when you only have a company name, then pass the domain to /scrape-contacts.

**Required (JSON body):**
- `keywords` (array of strings, max 20) Example: `["rapidapi", "wilson sonsini", "microsoft"]`

**Optional (JSON body):**
- `limit` (integer, default: 1) — values: 1-50 (max results per keyword)

**Pagination:** none
**Response path:** `data` (object keyed by keyword: a URL string when limit=1, an array of URLs when limit>1; keywords with no match are omitted)

---
