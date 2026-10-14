# ai-overviews

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/ai_overviews.yaml

**Host:** `ai-overviews.p.rapidapi.com`
**Notes:** Standalone AI Overviews API (its own RapidAPI listing and OpenWeb Ninja subscription). Single call per query, no pagination. Use `apis/ai-overviews/scrape.js`. To get AI Overviews together with organic results, use realtime-web-search `/search` with `fetch_ai_overviews=true`.

## Endpoints

### GET /ai-overviews
AI Overviews — Get Google Search AI Overviews, including text parts (paragraphs and lists) and reference links. Pulled in real-time from Google Search.

**Required:**
- `q` (string) Example: `How to approach solving a hard math problem?`

**Optional:**
- `location` (string) — city-level location the search originates from Example: `London, England, United Kingdom`
- `gl` (string, default: us) — Country code (ISO 3166-1 alpha-2) Example: `us`
- `hl` (string, default: en) — Language code (ISO 639-1 alpha-2) Example: `en`

**Pagination:** none
**Response path:** `data`
**Key fields:** search_returned_ai_overviews, text_parts (type, text, list), reference_links (title, link, snippet, source, date)

## Usage

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
  --query "your question here" --dry-run
```
