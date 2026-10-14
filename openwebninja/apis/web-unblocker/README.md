# web-unblocker

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/web_unblocker.yaml

**Host:** `web-unblocker1.p.rapidapi.com`
**Notes:** Fetches a single URL per call. No pagination.

## Endpoints

### POST /request
Request — Reliably fetch web pages with smart retries, optional JavaScript rendering, fine-grained load controls, and proxy support. Supports all common HTTP methods (GET, POST, PUT, PATCH, and DELETE).

**Required (JSON body):**
- `url` (string) — The URL to fetch Example: `https://www.google.com`

**Optional (JSON body):**
- `render_js` (boolean, default: false) — render JavaScript before returning the response
- `wait_until` (string, default: load) — values: domloaded, load, networkidle
- `headers` (object) — HTTP headers to send, as a key-value object
- `cookies` (array) — cookies to send, each with name, value, domain (required) and path
- `body` (string) — request payload for POST/PUT/PATCH (string or JSON object)
- `load_images` (boolean, default: false) — load images when rendering JavaScript
- `load_stylesheets` (boolean, default: false) — load stylesheets when rendering JavaScript
- `wait_for_timeout` (string) — seconds to wait after page load
- `wait_for_selector` (string) — CSS selector to wait for
- `extra_retries` (boolean, default: false) — allow extra internal retries (2 request credits when triggered)
- `success_status_codes` (array of numbers, default: [200])
- `success_selectors` (string) — CSS selectors that mark the request as successful
- `failiure_selectors` (string) — CSS selectors that mark the request as failed (spelled as in the API)
- `min_response_length` (number) — minimum response body size in bytes
- `networkidle_timeout` (number, default: 0.5) — seconds, when wait_until=networkidle
- `proxy` (string) — your own proxy URL
- `country` (string) — values: any, us, uk, ca (exit country; ignored when proxy is set)

**Pagination:** none
**Response path:** `data`
**Key fields:** status, final_url, headers, cookies (name, value, domain, path), body_length, body, error

---
