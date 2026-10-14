# google-ai-mode

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/google_ai_mode.yaml

**Host:** `google-ai-mode.p.rapidapi.com`
**Notes:** Standalone Google AI Mode API (its own RapidAPI listing and OpenWeb Ninja subscription). Use `apis/google-ai-mode/scrape.js`. Single response per call, no pagination. Supports multi-turn conversations via `session_token`. `POST /ai-mode` takes the same parameters as a JSON body (no URL length limit; recommended for long prompts and attachments).

## Endpoints

### GET /ai-mode
AI Mode — Send a prompt/query and get structured results and reference links from Google AI Mode.

**Required:**
- `prompt` (string) Example: `How to make a pizza step by step?`

**Optional:**
- `session_token` (string) — Token from a previous AI Mode response, to continue the conversation
- `location` (string) — city-level location the prompt originates from Example: `London, England, United Kingdom`
- `uule` (string) — Google encoded location string; cannot be combined with `location`
- `gl` (string, default: us) — Country code (ISO 3166-1 alpha-2) Example: `us`
- `hl` (string, default: en) — Language code (ISO 639-1 alpha-2) Example: `en`
- `attachments` (string) — JSON array of PDF URLs passed as a string, up to 5 files of 10 MB each (1 extra credit) Example: `["https://example.com/file.pdf"]`
- `url` (string) — a full Google AI Mode URL (`/search?...&udm=50`) to fetch instead of a prompt
- `return_raw_html` (boolean, default: false) — return the raw HTML in `data.raw_html` instead of parsed results

**Pagination:** none
**Response path:** `data`
**Key fields:** reply_parts (type, text, ordered, list, images), reference_links (title, link, snippet, source, favicon, date), session_token, raw_html (when return_raw_html=true)

---

### POST /ai-mode
AI Mode — POST variant of the AI Mode endpoint: the same parameters in a JSON request body, with no URL length limit.

**Required (JSON body):**
- `prompt` (string) Example: `How to make a pizza step by step?`

**Optional (JSON body):**
- `session_token` (string)
- `tbs` (string)
- `location` (string)
- `uule` (string) — cannot be combined with `location`
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`
- `attachments` (array of strings) — PDF URLs, up to 5 files of 10 MB each Example: `["https://pdfobject.com/pdf/sample.pdf"]`
- `url` (string)
- `return_raw_html` (boolean, default: false)

**Pagination:** none
**Response path:** `data`
**Key fields:** reply_parts, reference_links, session_token, raw_html (when return_raw_html=true)

## Usage

```bash
node --env-file=.env openwebninja_universal_scraper/apis/google-ai-mode/scrape.js \
  --query "your prompt here" --dry-run
```
