---
name: openwebninja_universal_scraper
description: Universal scraper for any OpenWeb Ninja API. Scrape jobs, business listings, products, reviews, news, social profiles, finance data, and more. Use for lead generation, market research, competitor analysis, content monitoring, price tracking, or any structured data extraction task.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch
---

# OpenWeb Ninja Universal Scraper

Data extraction from 35+ OpenWeb Ninja APIs. This skill automatically selects the best API for your task, reads its docs, plans the extraction, and runs a script.

## Prerequisites
(No need to check upfront)

- `.env` file with `RAPIDAPI_KEY` (or `OPENWEBNINJA_API_KEY`)
- Node.js 20.6+ (for native `--env-file` support)

## Missing API Key — Setup Instructions

Before making any API call, check that the required key exists in `.env`. If it is missing:

1. Read `meta.json` for the selected API to get `openwebninja_url` and `rapidapi_url`
2. Open the subscription page in the user's browser (prefer OpenWeb Ninja):
   ```bash
   open "{openwebninja_url}"    # preferred
   # or: open "{rapidapi_url}" # if user prefers RapidAPI
   ```
3. Tell the user: **"I've opened the subscription page. Subscribe to the API, then paste your API key here."**
4. When the user pastes the key, append it to `.env`:
   - If the key starts with `ak_`: append `OPENWEBNINJA_API_KEY={key}`
   - Otherwise: append `RAPIDAPI_KEY={key}`
   - Check if the line already exists in `.env` first — replace it rather than duplicating
5. Continue with the original request

## Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Understand user goal and select API(s)
- [ ] Step 2: Read API docs (README.md, recipes.md, meta.json)
- [ ] Step 3: Estimate and confirm cost (number of API requests required for each relevant API) with user
- [ ] Step 4: Ask user preferences (format, filename, count)
- [ ] Step 5: Run the script
- [ ] Step 6: Summarize results and offer follow-ups
```

---

### Step 1: Understand User Goal and Select API

First, understand what the user wants to achieve. Then select the best API from the catalog below.

Each API has its own folder at `apis/{api_id}/` containing:
- `README.md` — endpoints, params, pagination, response fields (source of truth)
- `meta.json` — host, pricing notes, subscription URLs
- `scrape.js` — per-API CLI script (if available for this API)
- `recipes.md` — common use cases with exact commands (if available)

#### API Catalog

| API ID | What It Does | Best For |
|--------|-------------|----------|
| `local-business-data` | Google Maps businesses with emails, phones, social profiles | Lead gen, competitor research, local market analysis |
| `realtime-amazon-data` | Amazon products, details, reviews by ASIN | Product research, price tracking, review mining |
| `realtime-web-search` | Google organic search results with rich snippets | General research, competitor analysis, content discovery |
| `realtime-news-data` | News articles by keyword with source/topic/date filters | Content monitoring, trend research, brand monitoring |
| `jsearch` | Job listings from Google for Jobs + salary estimates | Job market research, recruitment, salary benchmarking |
| `job-salary-data` | Salary estimates by job title and location | Salary benchmarking (also available via jsearch `/estimated-salary`) |
| `website-contacts-scraper` | Emails, phones, social links from domains (batch up to 20) | Contact enrichment, lead enrichment from domain lists |
| `trustpilot-company-and-reviews` | Trustpilot company profiles and reviews (~200 max) | Reputation analysis, review mining, brand monitoring |
| `realtime-glassdoor-data` | Company profiles, employee reviews, salaries | Employer intelligence, comp benchmarking, due diligence |
| `yelp-business-data` | Yelp businesses and customer reviews | Local business reviews, reputation monitoring |
| `realtime-product-search` | Google Shopping cross-retailer product search | Price comparison, product discovery, deal tracking |
| `realtime-walmart-data` | Walmart products, details, reviews | Retail research, price comparison |
| `realtime-costco-data` | Costco products (US/Canada) | Retail research |
| `realtime-zillow-data` | Zillow properties for sale, rent, or recently sold | Real estate research, market analysis |
| `realtime-forums-search` | Reddit, Quora, Stack Overflow discussions | Sentiment analysis, trend research, content ideas |
| `realtime-events-search` | Google Events by keyword + location | Event discovery, local activity monitoring |
| `realtime-finance-data` | Stocks, ETFs, forex, crypto quotes + history | Finance research, market monitoring |
| `realtime-image-search` | Google Images with size/color/license filters | Visual research, content sourcing |
| `realtime-shorts-search` | YouTube Shorts, TikTok, Instagram Reels | Short-form video discovery, trend tracking |
| `realtime-books-data` | Google Books search | Book research, content discovery |
| `realtime-lens-data` | Google Lens visual search | Visual product matching, reverse image lookup |
| `play-store-apps` | Google Play apps, top charts | App research, market analysis |
| `social-links-search` | Social media profiles for any person/brand | Social profile discovery, lead enrichment |
| `email-search` | Email addresses by name + domain | Lead gen, contact discovery |
| `local-rank-tracker` | Local SEO keyword rankings + grid heatmaps | Local SEO monitoring, competitor rank tracking |
| `web-search-autocomplete` | Google autocomplete suggestions (bulk supported) | Keyword research, search intent discovery |
| `reverse-image-search` | Web pages containing a given image | Image provenance, unauthorized usage detection |
| `driving-directions` | Routes with distance, duration, turn-by-turn steps | Navigation, commute analysis, logistics |
| `ev-charge-finder` | EV charging stations by location | EV infrastructure research, trip planning |
| `waze` | Real-time traffic alerts and jams | Traffic monitoring, incident tracking |
| `web-unblocker` | Fetch any URL with JS rendering + anti-bot bypass | Web scraping, page extraction |
| `chatgpt` | ChatGPT conversation (POST, stateful) | Data summarization, AI enrichment |
| `gemini` | Google Gemini conversation (POST, stateful) | Data analysis, AI enrichment |
| `copilot` | Microsoft Copilot conversation (POST, stateful) | Research, AI enrichment |
| `ai-overviews` | Google AI Overview with cited sources | Quick research summaries |
| `google-ai-mode` | Google AI Mode (Gemini 2.5) structured results | AI-augmented research |

#### API Selection by Use Case

| Use Case | Primary APIs |
|----------|-------------|
| **Lead Generation** | `local-business-data` (with `extract_emails_and_contacts=true`), `website-contacts-scraper`, `email-search`, `social-links-search` |
| **Lead Enrichment from Domains** | `website-contacts-scraper`, `social-links-search`, `email-search` |
| **Job Market Research** | `jsearch`, `job-salary-data`, `realtime-glassdoor-data` |
| **Employer / Talent Intelligence** | `jsearch`, `realtime-glassdoor-data`, `job-salary-data`, `realtime-news-data` |
| **Product / Price Research** | `realtime-amazon-data`, `realtime-product-search`, `realtime-costco-data`, `realtime-walmart-data`, `realtime-lens-data` |
| **Retail Review Mining** | `realtime-amazon-data`, `realtime-walmart-data`, `trustpilot-company-and-reviews`, `yelp-business-data` |
| **Brand & Review Monitoring** | `yelp-business-data`, `trustpilot-company-and-reviews`, `realtime-glassdoor-data`, `realtime-news-data`, `realtime-forums-search` |
| **Competitor Analysis** | `realtime-web-search`, `social-links-search`, `realtime-news-data`, `website-contacts-scraper`, `realtime-glassdoor-data`, `trustpilot-company-and-reviews` |
| **Content & Trend Research** | `realtime-news-data`, `realtime-forums-search`, `realtime-shorts-search`, `realtime-image-search`, `realtime-books-data`, `web-search-autocomplete` |
| **Search Intent / Keyword Discovery** | `web-search-autocomplete`, `realtime-web-search`, `realtime-news-data`, `realtime-forums-search` |
| **Real Estate** | `realtime-zillow-data` |
| **Real Estate + Commute / Traffic Overlay** | `realtime-zillow-data`, `driving-directions`, `waze` |
| **Finance / Markets** | `realtime-finance-data`, `realtime-news-data` |
| **Social Profile Discovery** | `social-links-search`, `website-contacts-scraper`, `email-search`, `realtime-web-search` |
| **Events & Local Activity** | `realtime-events-search`, `local-business-data`, `waze`, `driving-directions` |
| **App Research** | `play-store-apps`, `realtime-news-data`, `realtime-forums-search` |
| **Visual / Image Search** | `realtime-image-search`, `realtime-lens-data`, `reverse-image-search` |
| **Navigation & Mobility** | `driving-directions`, `ev-charge-finder`, `waze` |
| **Traffic / Incident Monitoring** | `waze`, `driving-directions` |
| **Local SEO & Rank Tracking** | `local-rank-tracker`, `local-business-data`, `realtime-web-search` |
| **Reputation / Trust Analysis** | `trustpilot-company-and-reviews`, `yelp-business-data`, `realtime-news-data`, `realtime-forums-search` |
| **Web Scraping (any website)** | `web-unblocker` |
| **AI-Augmented Enrichment** | `chatgpt`, `gemini`, `copilot`, `google-ai-mode`, `ai-overviews` |

---

#### Multi-API Workflows

For complex tasks, chain multiple APIs:

| Workflow | Step 1 | Step 2 |
|----------|--------|--------|
| **Domain → contacts pipeline** | `website-contacts-scraper /scrape-contacts` → | `email-search /search` |
| **Contact → LinkedIn discovery** | `social-links-search /search` → | `realtime-web-search /search` |
| **Review deep-dive** | `yelp-business-data /business-search` → | `yelp-business-data /business-reviews` |
| **Trustpilot reputation analysis** | `trustpilot-company-and-reviews /company-search` → | `trustpilot-company-and-reviews /company-reviews` |
| **Product research (multi-store)** | `realtime-product-search /search` → | `realtime-amazon-data /product-details` |
| **Retail price comparison** | `realtime-product-search /search` → | `realtime-walmart-data /product-details` |
| **Product + reviews dataset** | `realtime-amazon-data /product-details` → | `realtime-amazon-data /product-reviews` |
| **Product intelligence report** | `realtime-amazon-data /product-details` → | `chatgpt /chat` |
| **Visual product discovery** | `realtime-lens-data /search-by-image` → | `realtime-product-search /search` |
| **Competitor intelligence** | `realtime-web-search /search` → | `local-business-data /search` (with `extract_emails_and_contacts=true`) |
| **Brand monitoring pipeline** | `realtime-news-data /search` → | `realtime-forums-search /search` |
| **Content trend discovery** | `web-search-autocomplete /autocomplete` → | `realtime-web-search /search` |
| **News summarization** | `realtime-news-data /search` → | `gemini /chat` |
| **Forum discussion analysis** | `realtime-forums-search /search` → | `copilot /chat` |
| **App market research** | `play-store-apps /search` → | `realtime-forums-search /search` |
| **App reputation analysis** | `play-store-apps /app-details` → | `realtime-news-data /search` |
| **Job market research** | `jsearch /search` → | `jsearch /estimated-salary` |
| **Employer intelligence** | `jsearch /search` → | `realtime-glassdoor-data /company-overview` |
| **Local SEO rank tracking** | `local-rank-tracker /search` → | `local-business-data /business-details` |
| **Local market analysis** | `local-business-data /search` → | `yelp-business-data /business-search` |
| **Real estate dataset** | `realtime-zillow-data /search` → | `driving-directions /get-directions` |
| **Property + traffic insights** | `realtime-zillow-data /search` → | `waze /alerts-and-jams` |
| **EV trip planning** | `driving-directions /get-directions` → | `ev-charge-finder /search-by-location` |
| **Event discovery** | `realtime-events-search /search` → | `local-business-data /search` |
| **Image provenance discovery** | `reverse-image-search /search` → | `realtime-web-search /search` |
| **Web page extraction workflow** | `realtime-web-search /search` → | `web-unblocker /fetch` |
| **Knowledge-augmented research** | `realtime-web-search /search` → | `ai-overviews /ai-overviews` |
| **Dataset summarization** | `realtime-product-search /search` → | `chatgpt /chat` |

---

### Step 2: Read API Docs

> **CRITICAL RULE: Always read the API's README.md before making any API call.** Never guess endpoints, parameters, or request structure. The README.md is the single source of truth — check it every time, including for quick tests or diagnostic calls.

Read the docs and meta for the selected API:

```
apis/{api_id}/README.md    ← endpoints, params, response schema (source of truth)
apis/{api_id}/meta.json    ← host, pricing notes, subscription URLs
apis/{api_id}/recipes.md   ← common use cases with exact commands (if available)
```

From these files, determine:
- Which endpoint(s) to call
- Required and optional parameters
- Pagination style for the specific endpoint (`page_number`, `offset`, `cursor`, `none`)
- Any pricing multipliers or quirks
- Response field paths for the data you need

### Step 3: Estimate and Confirm Cost

Before asking preferences or running anything, tell the user exactly what calls will be made:

- Which API(s) will be called and which endpoint(s)
- How many API calls are required (based on requested result count ÷ page size, plus any multi-step lookups)
- If multiple APIs are chained, break down the call count per API

Example format:
```
Planned API calls:
  • local-business-data /search — 1 call per zip code × 50 zip codes = 50 calls
  • local-business-data /business-details (extract_emails_and_contacts=true) — 1 call per business × up to 500 = 500 calls
  Total: ~550 calls
```

Then ask: **"Does that look okay? Would you like to proceed?"**

Only continue to Step 4 once the user confirms.

### Step 4: Ask User Preferences

Before running, ask:
1. **Output destination** — if the user did not specify where to send the data, always present all available options:
   - **Chat** — display top results inline (no file saved)
   - **Local file (JSON or CSV)** — saved to `./output/`
   - **Google Sheets** — requires `GOOGLE_CLIENT_CREDENTIALS`, `SPREADSHEET_ID`, `SHEET_NAME` in `.env`
   - **Webhook** — HTTP POST to any URL (Zapier, Make, n8n, custom); requires `WEBHOOK_URL` in `.env`
   - **Airtable** — requires `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` in `.env`
   - **Slack** — post summary + data to a channel; requires `SLACK_WEBHOOK_URL` in `.env`
   - **S3** — requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `S3_KEY` in `.env`
   - **FTP** — requires `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PATH` in `.env`
2. **Number of results** (default: 100)
3. **Output filename** (default: auto-generated with timestamp) — only if saving to a file

### Step 5: Run the Script

**If the API has a `scrape.js`**, use it directly:

```bash
# Full export to file
node --env-file=.env apis/{api_id}/scrape.js --query "search terms" --count 100 --format csv --output output/results.csv

# Quick answer (no file, display top results in chat)
node --env-file=.env apis/{api_id}/scrape.js --query "search terms" --dry-run
```

**Quick answer mode**: For simple lookups (e.g., "what's Nike's rating on Trustpilot?", "find me 3 coffee shops in LA"), use `--dry-run`. It fetches one page of results and prints them to the console without saving a file. Use this when the user just needs a quick answer, not a full data export.

Check `apis/{api_id}/recipes.md` for exact command examples.

Run `node apis/{api_id}/scrape.js --help` to see all available flags for that API.

**For multi-API workflows or APIs without `scrape.js`**, write a custom script importing from `lib/utils.js`:

```js
const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, displayQuickAnswer, sleep } = require('lib/utils');
```

`lib/utils.js` exports:
- `getApiKey()` — reads `RAPIDAPI_KEY` / `OPENWEBNINJA_API_KEY` from env
- `loadMeta(apiId)` — loads `meta.json`
- `apiCall(host, endpoint, params, apiKey, method, body)` — single HTTP call (GET or POST)
- `fetchAll({ host, endpoint, params, apiKey, count, pagination, ... })` — paginated fetch, returns `{ results, totalCallsMade }`
- `toCSV(records)` — converts array of objects to CSV string
- `writeOutput(records, outputPath, format, manifest)` — writes file + `.meta.json`
- `displayQuickAnswer(records, { limit, fields })` — print top N results to chat (no file)
- `pushWebhook(records, { url, batchMode, delay })` — POST to Zapier/Make/n8n/custom webhook
- `pushAirtable(records, { apiKey, baseId, tableName })` — push to Airtable table
- `postSlack(message)` / `slackSummary(records, outputPath)` — post to Slack channel
- `pushS3(content, { bucket, key, region })` — upload JSON/CSV to S3
- `pushFTP(localFilePath, { host, user, pass, remotePath })` — upload file via FTP
- `pushGoogleSheets(records, { credentialsPath, spreadsheetId, sheetName })` — write to Google Sheets
- `sleep(ms)` — promise-based delay

### Step 6: Summarize Results and Offer Follow-ups

After completion, report:
- Number of results found
- File location and name
- Key fields available in the output
- **Suggested follow-up workflows** based on results:

| If the User Retrieved | Suggested Next Workflow |
|-----------------------|------------------------|
| **Product listings** | Fetch reviews with `realtime-amazon-data` / `realtime-walmart-data` or generate insights with `chatgpt` |
| **Reviews or feedback data** | Summarize sentiment and themes with `gemini`, `copilot`, or `chatgpt` |
| **Job listings** | Enrich compensation data using `jsearch /estimated-salary` or company insights with `realtime-glassdoor-data` |
| **News / forum discussions** | Generate trend analysis using `gemini`, `copilot`, or `ai-overviews` |
| **Property listings** | Add commute insights using `driving-directions` or traffic context with `waze` |
| **Search keyword ideas** | Expand queries using `web-search-autocomplete` and validate with `realtime-web-search` |
| **App listings** | Analyze reputation using `realtime-forums-search` or summarize feedback with `chatgpt` |

---

## General Usage Tips

- **Lead generation:** Use `local-business-data` with `extract_emails_and_contacts=true`. For full coverage of a region, use `--grid` mode with a bounding box (auto-subdivides dense areas). For city-level, use `--zips` mode. The scrape.js script loads `gmb_categories.json` and `us_zipcodes.json` internally when needed.
- **Contact enrichment from domains:** `website-contacts-scraper` → `email-search` → `social-links-search`.
- **Multi-store price comparison:** Chain `realtime-amazon-data` + `realtime-walmart-data` + `realtime-product-search`. Note: price formats differ across APIs (string vs numeric).
- **AI enrichment:** `chatgpt`, `gemini`, `copilot` use POST endpoints — use their `scrape.js` or write a custom script importing from `lib/utils.js`.
- **Known limitations:**
  - Yelp name matching is unreliable for cross-referencing with other APIs
  - Trustpilot reviews capped at ~200 without authentication
  - `realtime-shorts-search` may return empty results for some queries
  - Company name searches (Glassdoor, Trustpilot) need exact names for disambiguation — "Disney" ≠ "Walt Disney Company"

---

## Error Handling

- `RAPIDAPI_KEY not found` / `OPENWEBNINJA_API_KEY not found` — Follow the **Missing API Key — Setup Instructions** section above
- `HTTP 401` — API key invalid or expired; check subscription
- `HTTP 403` — Not subscribed to this API; check subscription on RapidAPI or OpenWeb Ninja dashboard
- `HTTP 429` — Rate limit hit; increase `--delay` (try 1000ms)
- `No results on page 1` — Check params against the API's `README.md`; required params may be missing
- `Cost cap exceeded` — Increase `--max-calls` or reduce `--count`

---

## Output Destinations

All destinations are implemented in `lib/utils.js` and can be imported in any custom script:

```js
const { pushWebhook, pushAirtable, postSlack, slackSummary, pushS3, pushFTP, pushGoogleSheets } = require('lib/utils');
```

| Destination | Function | Env Vars Required | npm Package |
|-------------|----------|-------------------|-------------|
| Local file | `writeOutput(records, path, format)` | — | — |
| Chat (quick answer) | `displayQuickAnswer(records)` | — | — |
| Webhook (Zapier/Make/n8n) | `pushWebhook(records, { url, batchMode, delay })` | `WEBHOOK_URL` | — |
| Airtable | `pushAirtable(records, { apiKey, baseId, tableName })` | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | — |
| Slack | `postSlack(message)` / `slackSummary(records, outputPath)` | `SLACK_WEBHOOK_URL` | — |
| S3 | `pushS3(content, { bucket, key, region, contentType })` | `S3_BUCKET`, `S3_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `@aws-sdk/client-s3` |
| FTP | `pushFTP(localFilePath, { host, user, pass, remotePath })` | `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PATH` | `basic-ftp` |
| Google Sheets | `pushGoogleSheets(records, { credentialsPath, spreadsheetId, sheetName })` | `GOOGLE_CLIENT_CREDENTIALS`, `SPREADSHEET_ID`, `SHEET_NAME` | `googleapis` |

**Notes:**
- Webhook `batchMode=true` (default) sends all records in one POST as `{ records: [...] }`. Set `batchMode=false` for Zapier (one POST per record).
- Airtable field names must match existing column names in the table exactly.
- S3/FTP/Google Sheets require their npm package installed: `npm install @aws-sdk/client-s3 basic-ftp googleapis`
- Google Sheets requires a service account JSON file with the Sheets API enabled.
