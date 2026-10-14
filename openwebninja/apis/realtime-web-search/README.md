# realtime-web-search

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_web_search-v2.yaml

**Host:** `real-time-web-search.p.rapidapi.com`
**Notes:** v2 of the API. With an OpenWeb Ninja key the base path is `/realtime-web-search/v2` (meta.json `own_slug`); on RapidAPI the same routes are served at the host root. /search is offset-paginated via `start` with up to 10 results per call (`num`, max 10). /search-light returns up to 300 results in one call (`num`).

## Endpoints

### GET /search-light
Search Light

**Required:**
- `q` (string) Example: `how to build a website`

**Optional:**
- `num` (integer, default: 10) — values: 1-300
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`

**Pagination:** none (one call returns up to `num` results)
**Page size param:** `num` (default: 10, max: 300)
**Response path:** `data` (array of organic results)
**Key fields:** title, snippet, url, domain, position, published_timestamp, thumbnail

---

### GET /search
Search

**Required:**
- `q` (string) Example: `albert einstein`

**Optional:**
- `num` (integer, default: 10) — values: 1-10
- `start` (integer, default: 0) Example: `0`
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`
- `location` (string) Example: `London, England, United Kingdom`
- `uule` (string) — cannot be combined with `location`
- `device` (string, default: desktop) — values: desktop, mobile, tablet
- `lr` (string) Example: `lang_fr|lang_de`
- `tbs` (string) Example: `qdr:w`
- `nfpr` (string, default: 0) — values: 0, 1
- `nhr` (string, default: 0) — values: 0, 1
- `fetch_ai_overviews` (boolean, default: false) Example: `false`
- `return_organic_result_video_thumbnail` (boolean, default: false) Example: `false`

**Pagination:** offset (param: `start`)
**Page size param:** `num` (default: 10, max: 10)
**Response path:** `data` (organic results in `data.organic_results[]`)
**Key fields:** organic_results (title, url, snippet, source, displayed_link, domain, date, position, rank), total_organic_results, has_ai_overviews, ai_overviews, ads, answer_box, knowledge_graph, top_stories, shopping_results, inline_videos, discussions_and_forums, places, related_searches

---

### POST /ai-mode
AI Mode

**Required (JSON body):**
- `prompt` (string) Example: `How to make a pizza step by step?`

**Optional (JSON body):**
- `session_token` (string) — token from a previous AI Mode response, to continue the conversation
- `tbs` (string)
- `location` (string) Example: `London, England, United Kingdom`
- `uule` (string) — cannot be combined with `location`
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`
- `attachments` (array of strings) — PDF URLs, up to 5 files of 10 MB each Example: `["https://pdfobject.com/pdf/sample.pdf"]`

**Pagination:** none
**Response path:** `data`
**Key fields:** reply_parts (type, text, ordered, list, images), reference_links (title, link, snippet, source, favicon, date), session_token

---

### GET /people-also-ask
People Also Ask

**Required:**
- `q` (string) Example: `apple inc`

**Optional:**
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`
- `location` (string)
- `lr` (string)
- `tbs` (string)
- `nfpr` (string, default: 0) — values: 0, 1
- `nhr` (string, default: 0) — values: 0, 1
- `fetch_answers` (string, default: true) — values: true, false, 0, 1

**Pagination:** none
**Response path:** `data` (questions in `data.people_also_ask[]`)
**Key fields:** question, answer, source (url, domain, title; only when a source link is found)

---

### POST /search-light-bulk
Search Light Bulk

**Required (JSON body):**
- `queries` (array of strings, max 100) Example: `["chatgpt", "build a website"]`

**Optional (JSON body):**
- `limit` (integer, default: 10) — values: 1-300 Example: `10`
- `gl` (string, default: us) Example: `us`
- `hl` (string, default: en) Example: `en`

**Pagination:** none
**Response path:** `data` (one entry per query)
**Key fields:** query, results (title, snippet, url, domain, position)

---
