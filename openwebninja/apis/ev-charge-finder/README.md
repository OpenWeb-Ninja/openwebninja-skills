# ev-charge-finder

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/ev_charge_finder.yaml

**Host:** `ev-charge-finder.p.rapidapi.com`
**Notes:** Returns all stations matching the location/radius in a single call. No pagination. `connectors` is null on every station: Google is not providing connector data right now.

## Endpoints

### GET /search-by-location
Search by Location — Search for EV charging stations near a specific location specified as a free-form location query (e.g. `San Francisco, CA, USA`). Returns 400 when `near` does not name a place. The `type`, `available`, `min_kw` and `max_kw` filters are not supported right now: Google is not providing connector data for charging stations, so a request with any of them returns 400 (not billed). Returns 503 (retryable, not billed) when Google Maps could not be reached.

**Required:**
- `near` (string) — Free-form location query to search near by: a city, address, ZIP code or landmark. A query that does not name a place returns 400. Example: `San Francisco, CA, USA`

**Optional:**
- `type` (string) Example: `CHAdeMO` — **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `available` (boolean) Example: `true` — **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `min_kw` (number, default: 0) — **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `max_kw` (number, default: 0) — **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `limit` (number, default: 20) Example: `20`
- `query` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)

---

### GET /search-by-coordinates-point
Search by Coordinates Point — Search for EV charging stations near specific geographic coordinates point. The `type`, `available`, `min_kw` and `max_kw` filters are not supported right now: Google is not providing connector data for charging stations, so a request with any of them returns 400 (not billed). Returns 503 (retryable, not billed) when Google Maps could not be reached.

**Required:**
- `lat` (number) — Latitude of the geographic coordinates point to search near by. Example: `37.359428`
- `lng` (number) — Longitude of the geographic coordinates point to search near by. Example: `-121.925337`

**Optional:**
- `type` (string) — **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `available` (string) — Find EV charging stations with an available connector. **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `min_kw` (number) — Restrict the result to the availability for connectors with a specific minimal value of power in kilowatts (closed interval - with that value). **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `max_kw` (number) — Restrict the result to the availability for connectors with a specific maximum value of power in kilowatts (closed interval - with that value). **Currently not supported:** Google is not providing connector data, so a request with this filter returns 400 (not billed).
- `limit` (number, default: 20) Example: `20`
- `query` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)

---
