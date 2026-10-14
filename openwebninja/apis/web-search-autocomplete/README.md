# web-search-autocomplete

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/web_search_autocomplete.yaml

**Host:** `web-search-autocomplete.p.rapidapi.com`
**Notes:** Returns suggestions in a single call. cursor_pointer is a character position, not a pagination token.

## Endpoints

### GET /autocomplete
Autocomplete — Get query suggestions from Google Search, including Knowledge Graph information when available.

**Required:**
- `query` (string) — Autocomplete / typeahead search query. Example: `to`

**Optional:**
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `user_agent` (string, default: desktop) — values: desktop, mobile
- `cursor_pointer` (string)

**Pagination:** none
**Response path:** `data` (array of suggestions)
**Key fields:** query, highlights (offset, length), entity_title, entity_subtitle, entity_image, entity_images

---

### POST /autocomplete
Autocomplete (Bulk) — Get query suggestions for multiple queries in a single request (up to 50 queries). Returns autocomplete suggestions grouped per input query. Each query is charged as one request.

**Required (JSON body):**
- `queries` (array of strings, max 50) Example: `["to", "new y"]`

**Optional (JSON body):**
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `user_agent` (string, default: desktop) — values: desktop, mobile
- `cursor_pointer` (integer) — character position; defaults to the number of queries when omitted

**Pagination:** none
**Response path:** `data` (one entry per query)
**Key fields:** query, results (query, highlights, entity_title, entity_subtitle, entity_image, entity_images)

---
