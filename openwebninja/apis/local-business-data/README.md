# local-business-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/local_business_data.yaml

**Host:** `local-business-data.p.rapidapi.com`
**Notes:** limit param controls results per call (max 500). Search endpoints have no pagination — one call returns all results up to limit (POST /search also takes an `offset`). Reviews, photos and posts are cursor-paginated.
**Pricing:** The API charges a "Business" credit for each business, review, or photo returned by the API. When extract_emails_and_contacts=true is used, the API charges 1 extra credit per business that has at least one email, phone number, or social profile match.

## Endpoints

### GET /search
Search

**Required:**
- `query` (string) Example: `Hotels in San Francisco, USA`

**Optional:**
- `limit` (integer, default: 20) — values: 1-500 Example: `20`
- `lat` (string, default: 37.359428) Example: `37.359428`
- `lng` (string, default: -121.925337) Example: `-121.925337`
- `zoom` (string, default: 13) Example: `13`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `subtypes` (string)
- `verified` (boolean) — Only return verified businesses Example: `true`
- `business_status` (string) — Comma separated: OPEN, CLOSED_TEMPORARILY, CLOSED Example: `OPEN`
- `extract_emails_and_contacts` (boolean, default: false) Example: `false`
- `fields` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### POST /search
Bulk Search — Search multiple queries in a single request (up to 20 queries). Returns a flat, normalized list of businesses aggregated across all queries.

**Required (JSON body):**
- `queries` (array of strings, max 20) Example: `["plumber in texas", "coffee shop in san francisco"]`

**Optional (JSON body):**
- `limit` (integer, default: 20) — Businesses per query, values: 1-500 Example: `5`
- `offset` (integer, default: 0) — Businesses to skip per query (pagination), values: 0-500 Example: `0`
- `zoom` (integer, default: 13) — values: 0-22 Example: `13`
- `coordinates` (string) — Bias the search toward a "lat,lng" location Example: `40.685219,-74.081180`
- `dedup` (boolean, default: true) — Deduplicate businesses across queries Example: `true`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`

**Pagination:** offset (body field: `offset`)
**Page size param:** `limit` (default: 20, per query)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /search-in-area
Area Search (Zoom Level)

**Required:**
- `query` (string) — Search query / keyword Example: `pizza`
- `lat` (string, default: 37.359428) Example: `37.359428`
- `lng` (string, default: -121.925337) Example: `-121.925337`
- `zoom` (string) Example: `13`

**Optional:**
- `limit` (string, default: 20) Example: `20`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `subtypes` (string)
- `extract_emails_and_contacts` (boolean, default: false) Example: `false`
- `fields` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /area-search-by-bounding-box
Area Search (Bounding Box) — Search businesses within a rectangular area defined by its bottom-left (south-west) and top-right (north-east) corner coordinates.

**Required:**
- `query` (string) — Search query / keyword Example: `pizza`
- `bottom_left` (string) — South-west corner as "lat,lng" Example: `40.606540,-74.013580`
- `top_right` (string) — North-east corner as "lat,lng" Example: `40.812151,-73.910522`

**Optional:**
- `limit` (string, default: 20) — values: 1-500 Example: `20`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `subtypes` (string) — Comma separated list of business categories Example: `Plumber,Carpenter,Electrician`
- `extract_emails_and_contacts` (boolean, default: false) Example: `false`
- `fields` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /area-search-by-radius
Area Search (Radius) — Search businesses within a circular area defined by a center coordinate point (lat, lng) and a radius in meters.

**Required:**
- `query` (string) — Search query / keyword Example: `pizza`
- `lat` (string, default: 37.359428) Example: `37.359428`
- `lng` (string, default: -121.925337) Example: `-121.925337`
- `radius` (string) — Radius in meters, values: 1-50000 Example: `5000`

**Optional:**
- `limit` (string, default: 20) — values: 1-500 Example: `20`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `subtypes` (string) — Comma separated list of business categories Example: `Plumber,Carpenter,Electrician`
- `extract_emails_and_contacts` (boolean, default: false) Example: `false`
- `fields` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /search-nearby
Search Nearby

**Required:**
- `query` (string) Example: `plumbers`
- `lat` (string, default: 37.359428) Example: `37.359428`
- `lng` (string, default: -121.925337) Example: `-121.925337`

**Optional:**
- `limit` (string, default: 20) Example: `20`
- `language` (string, default: en) Example: `en`
- `region` (string, default: us) Example: `us`
- `subtypes` (string)
- `extract_emails_and_contacts` (boolean, default: false) Example: `false`
- `fields` (string)

**Pagination:** none
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /business-details
Business Details — Get full business details including emails and social contacts. Supports batching of up to 20 Business Ids.

**Required:**
- `business_id` (string) — Comma separated, up to 20 Example: `0x880fd393d427a591:0x8cba02d713a995ed`

**Optional:**
- `extract_emails_and_contacts` (boolean, default: true) Example: `true`
- `extract_share_link` (boolean, default: false) Example: `false`
- `fields` (string)
- `region` (string, default: us) Example: `us`
- `language` (string, default: eu) Example: `eu`
- `coordinates` (string) Example: `37.09024,-95.712891`

**Pagination:** none
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true), reviews_per_rating, about, reviews_sample, located_in

---

### GET /business-details-plus
Business Details Plus — Business Details plus AI-powered enrichments: `keywords_mentioned_in_reviews` (most frequent keywords in the Google Maps reviews and how many reviews mention each). Costs 2 credits per business. Supports batching of up to 20 Business Ids.

**Required:**
- `business_id` (string) — Comma separated, up to 20 Example: `0x880fd393d427a591:0x8cba02d713a995ed`

**Optional:**
- `extract_emails_and_contacts` (boolean, default: true) Example: `true`
- `extract_share_link` (boolean, default: false) Example: `false`
- `fields` (string)
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`
- `coordinates` (string) Example: `37.09024,-95.712891`

**Pagination:** none
**Response path:** `data`
**Key fields:** all Business Details fields + keywords_mentioned_in_reviews

---

### GET /business-reviews-v2
Business Reviews — Get all / paginate business reviews by Business Id using a pagination cursor.

**Required:**
- `business_id` (string) — Accepts business_id / google_id or place_id Example: `0x89c259b5a9bd152b:0x31453e62a3be9f76`

**Optional:**
- `limit` (string, default: 20) — values: 1-100 Example: `20`
- `cursor` (string) — The `data.cursor` value from the previous response (omit on the first request).
- `translate_reviews` (boolean) — Translate reviews to `language` (defaults to false) Example: `false`
- `query` (string) — Return reviews matching a text query
- `sort_by` (string, default: most_relevant) — values: most_relevant, newest, highest_ranking, lowest_ranking
- `fields` (string) Example: `review_id,review_text,rating`
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** cursor (param: `cursor`, next value in `data.cursor`)
**Page size param:** `limit` (default: 20)
**Response path:** `data` (reviews in `data.reviews[]`)
**Key fields:** review_id, review_text, rating, review_datetime_utc, review_link, review_photos, review_language, like_count, author_id, author_name, author_link, author_review_count, owner_response_text, owner_response_datetime_utc

---

### GET /review-details
Business Review Details — Get the details of a specific review by Google Id / Business Id or Google Place Id and Review Author Id.

**Required:**
- `business_id` (string) Example: `0x89c259b5a9bd152b:0x31453e62a3be9f76`
- `review_author_id` (string) Example: `110228754725692228062`

**Optional:**
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** none
**Response path:** `data`
**Key fields:** review_id, review_text, rating, review_datetime_utc, review_link, author_id, author_name, owner_response_text

---

### GET /business-photos
Business Photos — Get business photos by Business Id.

**Required:**
- `business_id` (string) Example: `0x89c259b5a9bd152b:0x31453e62a3be9f76`

**Optional:**
- `limit` (string, default: 20) Example: `20`
- `cursor` (string)
- `is_video` (boolean, default: false) Example: `false`
- `region` (string, default: us) Example: `us`
- `fields` (string)

**Pagination:** cursor (param: `cursor`)
**Page size param:** `limit` (default: 20)
**Response path:** `data`
**Key fields:** photo_id, photo_url, photo_url_large, video_thumbnail_url, type, photo_datetime_utc

---

### GET /photo-details
Business Photo Details — Get extra details about a business photo (caption, owner name and avatar). Supports batching of up to 20 Photo Ids.

**Required:**
- `business_id` (string) Example: `0x89c259b5a9bd152b:0x31453e62a3be9f76`
- `photo_id` (string) Example: `AF1QipMPYCqZ5Fe8a7Jc51KT9pWOS5c6tOKY_xvkCl23`

**Pagination:** none
**Response path:** `data`
**Key fields:** photo_id, caption, width, height, owner_id, owner_name, owner_profile_link

---

### GET /business-posts
Business Posts — Get all / paginate Business Owner Posts ("From the owner" section on Google Maps) by Business Id, sorted chronologically.

**Required:**
- `business_id` (string) Example: `0x880fd393d427a591:0x8cba02d713a995ed`

**Optional:**
- `cursor` (string)
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** cursor (param: `cursor`, next value in `data.cursor`)
**Response path:** `data` (posts in `data.posts[]`)
**Key fields:** post_id, post_link, post_datetime_utc, post_text, post_links, post_photos

---

### GET /reverse-geocoding
Reverse Geocoding

**Required:**
- `lat` (string, default: 40.6958453) Example: `40.6958453`
- `lng` (string, default: -73.9799119) Example: `-73.9799119`

**Optional:**
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`
- `fields` (string)

**Pagination:** none
**Response path:** `data`
**Key fields:** business_id, place_id, name, phone_number, full_address, latitude, longitude, rating, review_count, website, type, subtypes, business_status, verified, working_hours, emails_and_contacts (when extract_emails_and_contacts=true)

---

### GET /autocomplete
Autocomplete — Returns place/address, business and query predictions for text-based geographic queries.

**Required:**
- `query` (string) — Search query Example: `new y`

**Optional:**
- `region` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`
- `coordinates` (string) Example: `37.381315,-122.046148`

**Pagination:** none
**Response path:** `data`
**Key fields:** type, google_id, place_id, description, main_text, secondary_text, latitude, longitude, country

---
