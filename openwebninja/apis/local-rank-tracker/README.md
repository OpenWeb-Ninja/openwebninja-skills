# local-rank-tracker

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/local_rank_tracker.yaml

**Host:** `local-rank-tracker.p.rapidapi.com`
**Notes:** Returns full rank results in a single call. No pagination.

## Endpoints

### GET /places
Search Business Locations — Returns a list of found Google My Business locations based on search query, including Service Area Businesses (SAB).

**Required:**
- `query` (string) — Search query. Example: `Jives Media`

**Optional:**
- `near` (string) Example: `California, USA`

**Pagination:** none
**Response path:** `data` (locations in `data.results[]`, total in `data.count`)
**Key fields:** place_id, lat, lng, name, address, sab, place_link, country, cid, google_id

---

### GET /search
Keyword Search at Coordinate Point — Get search results at the specified coordinate point without any rank comparison data.

**Required:**
- `query` (string) — Search query / keyword. Example: `web design`
- `lat` (number) Example: `37.341759`
- `lng` (number) Example: `-121.938314`

**Optional:**
- `zoom` (number, default: 13) Example: `13`

**Pagination:** none
**Response path:** `data` (results in `data.results[]`)
**Key fields:** rank, place_id, name, lat, lng, address, sab, place_link, country, reviews, rating, phone_number, website, verified, business_status, cid, google_id

---

### GET /calculate-grid-coordinates
Calculate Grid Coordinate Points — Get all grid coordinate points based on a center geocoordinate point and distance arguments.

**Required:**
- `lat` (number) Example: `37.341759`
- `lng` (number) Example: `-121.938314`
- `grid_size` (number, default: 3) — values: 3, 5, 7, 9, 11, 13, 15 Example: `3`
- `radius` (number, default: 1) Example: `1`

**Optional:**
- `radius_units` (number, default: km) Example: `km`

**Pagination:** none
**Response path:** `data`
**Key fields:** lat, lng, rc, index

---

### GET /ranking-at-coordinate
Ranking at Coordinate Point — Get search results at the specified coordinate point and additional ranking data for the business with `place_id`.

**Required:**
- `place_id` (string) — The Google Place ID of the business to match against in results. Example: `ChIJ0zS4SOvLj4AR1obZVVeLFM0`
- `query` (string) — Search query / keyword. Example: `web design`
- `lat` (number) Example: `37.341759`
- `lng` (number) Example: `-121.938314`

**Optional:**
- `zoom` (number, default: 13) Example: `13`

**Pagination:** none
**Response path:** `data` (target business `found` / `rank` at the point, all results in `data.results[]`)
**Key fields:** found, rank, count, results (rank, place_id, name, lat, lng, address, sab, place_link, country, reviews, rating, phone_number, website, verified, business_status, subtypes, cid, google_id)

---

### GET /grid
Full Grid Search — Make a full grid search and get the ranking of a specific business in every coordinate point in the grid.

**Required:**
- `place_id` (string) — The Google Place ID of the business to match against in results. Example: `ChIJoejvAr3Mj4ARtHrbKxtAHXI`
- `query` (string) — Search query / keyword. Example: `web design`
- `lat` (number) Example: `37.341759`
- `lng` (number) Example: `-121.938314`
- `grid_size` (number, default: 3) — values: 3, 5, 7, 9, 11, 13, 15 Example: `3`
- `radius` (number, default: 1) Example: `1`

**Optional:**
- `shape` (string, default: square) — values: square, round
- `radius_units` (string, default: km) — values: km, mi
- `zoom` (number, default: 13) Example: `13`

**Pagination:** none
**Response path:** `data` (one entry per grid point in `data.results[]`, ordered left-to-right then top-down)
**Key fields:** points, found, found_percent, average_rank, average_total_rank, top_3_rank_percent, results (lat, lng, index, found, rank, count, results)

---
