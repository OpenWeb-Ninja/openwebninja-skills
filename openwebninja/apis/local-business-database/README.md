# local-business-database

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/near_realtime_business_data.yaml

**Host:** `local-business-database.p.rapidapi.com` (private RapidAPI listing: use an OpenWeb Ninja `ak_` key, served at `api.openwebninja.com/local-business-database`)

Fast, Reliable, and Searchable Local Business & POI Database - Query Google Maps Business Listings by Name, Category, Address, City, ZIP, State, Country or Phone, Search Inside a Map Area, and Get Full Business Records, Reviews & Photos.

**When to use it:** building business datasets and lead lists in bulk. It returns every listing matching the filters (with the exact total in `match_count`), cost-effectively, from a worldwide database refreshed every 30 days. Every record carries `first_seen`, `last_seen` and `last_changed`. For a live, up-to-the-minute Google Maps lookup of a business (or emails and social profiles via `extract_emails_and_contacts`), use `local-business-data` instead.

## Endpoints

### GET /search
Search

Search listings by any combination of the filter parameters below. At least one filter is required. To search inside a map area, use `/area-search-by-bounding-box` or `/area-search-by-radius` (or the POST form). A query that matches nothing returns `200` with an empty `businesses` array.

**Filter parameters** (all optional, at least one required; shared by `/search`, `POST /search` and both area endpoints). Multi-value filters are OR-ed, up to 32 values each: comma-separated, or the parameter repeated. `city`, `district`, `owner_name` and `street_address` can only be repeated (a comma can be part of the value), or sent as an array in `POST /search`.
- `business_category` (array) — any category on the listing. Example: `restaurant`, `restaurant,bank,photography studio`
- `main_business_category` (array) — the listing's primary category (same values as `business_category`). Example: `Coffee shop`
- `business_category_id` (array) — Google entity-type ids (gcids). Broad: a listing usually carries several, so this is a wide filter. Example: `bakery,catholic_church`
- `main_business_category_id` (array) — gcid of the primary category (the machine id, not the display label). Example: `restaurant,hotel,dentist`
- `country` (array) — ISO 3166-1 alpha-2 code. Example: `US`, `US,MX,CA`
- `state` (array) — state or province; US states match by full name or two-letter code. Example: `Illinois,Florida`, `IL,FL`
- `city` (array) — repeat-only. Example: `Chicago`
- `zipcode` (array) — ZIP / postal code. Example: `60602,98112`
- `district` (array) — district or neighbourhood, when the listing carries one. Repeat-only. Example: `Chicago Loop`
- `name` (string) — display name. Example: `Truist`
- `owner_name` (array) — name on the owner profile. Repeat-only.
- `phone_number` (array) — with country code, E.164 (`+13127443356`, URL-encoded `%2B13127443356`) or decorated (`1-432-555-1234`, `(432) 555-1234`)
- `address` (string) — full formatted address including the business name. Example: `Truist, 12390 SW 120th St, Miami, FL 33186`
- `street_address` (array) — street line only. One value matches loosely (spelling and abbreviation variants); several values match exactly. Repeat-only. Example: `121 N LaSalle St #106`
- `business_id` (array) — exact Business Id match. Example: `0x102b644d009e013:0xea49e9ee285fa7bf`
- `verified` (boolean) — `true` for owner-claimed listings, `false` for unclaimed. Listings with unknown claim status match neither value.

**Optional:**
- `limit` (integer) — range: 1-500, businesses per call
- `cursor` (string) — the `cursor` from the previous response (valid only for the exact same query; it expires)
- `fields` (string) — comma-separated projection (`business_id` always included). Trims the response only; billing is unchanged. Values: any key listed under Key fields below.

**Pagination:** cursor (param: `cursor`; next value at top-level `cursor`, omitted on the last page)
**Page size param:** `limit` (max 500)
**Response path:** `data.businesses`
**Key fields:** business_id, name, address, address_short, street_address, district, city, zipcode, state, country, lat, lng, timezone, categories, main_category, category_ids, main_category_id, phone, website, tld, status, opening_status, opening_date, working_hours, open_24_7, closed_dow, rating, review_count, reviews_per_rating, photo_count, photos_sample, price_level, verified, place_id, google_mid, cid, place_link, reviews_link, booking_link, order_link, reservations_link, owner_id, owner_name, owner_link, about, located_in, hotel_stars, hotel_amenities, hotel_location_rating, hotel_review_summary, hotel_booking_options, hotel_results_from_web, first_seen, last_seen, last_changed
**Also in `data`:** match_count (total matching businesses, not the number on this page), limit

Fields with no value are left out of a record rather than returned as null. Search rows often lack `rating`, `review_count`, `reviews_per_rating` and `category_ids` even when the business has them; `/business-details` returns them.

---

### POST /search
Search

Same filters and results as `GET /search`, sent as a JSON body. Use it when the query is too long for a URL (up to 32 values on several fields), for multiple `city` / `district` / `owner_name` / `street_address` values, or to combine filters with an area. Every multi-value filter is a JSON array (max 32 items).

**Body (all optional, at least one filter required):**
- every filter parameter of `GET /search`, plus `limit` (1-500), `cursor`, and `fields` (array of field names, max 55)
- Area, either `bottom_left` + `top_right` (each `"lat,lng"` strings) or `lat` (-90 to 90) + `lng` (-180 to 180) + `radius` (meters, 1-100000). Not both, and not a partial group.

Example body: `{"business_category": "restaurant", "limit": 10, "country": "US", "state": "Illinois", "city": "Chicago"}`

**Pagination:** cursor (body field `cursor`; next value at top-level `cursor`)
**Response path:** `data.businesses`
**Key fields:** same business object as `GET /search`

---

### GET /area-search-by-bounding-box
Area Search By Bounding Box

Listings inside a rectangle defined by its south-west and north-east corners. Any filter parameter of `/search` can be combined with it.

**Required:**
- `bottom_left` (string) — south-west corner as `lat,lng`. Example: `41.87,-87.64`
- `top_right` (string) — north-east corner as `lat,lng`. Example: `41.89,-87.62`

**Optional:**
- every filter parameter of `/search`, plus `limit` (1-500), `cursor`, `fields`

**Pagination:** cursor (param: `cursor`)
**Page size param:** `limit` (max 500)
**Response path:** `data.businesses`
**Key fields:** same business object as `/search`
**Also in `data`:** match_count, limit

---

### GET /area-search-by-radius
Area Search By Radius

Listings within a distance of a center point. Any filter parameter of `/search` can be combined with it.

**Required:**
- `lat` (number) — range: -90 to 90. Example: `41.8827`
- `lng` (number) — range: -180 to 180. Example: `-87.6233`
- `radius` (number) — meters, range: 1-100000. Example: `1000`

**Optional:**
- every filter parameter of `/search`, plus `limit` (1-500), `cursor`, `fields`

**Pagination:** cursor (param: `cursor`)
**Page size param:** `limit` (max 500)
**Response path:** `data.businesses`
**Key fields:** same business object as `/search`
**Also in `data`:** match_count, limit

---

### GET /business-details
Business Details

Full business records by Business Id, including the menu, popular times, services and price tier that the search endpoints do not return. Up to 500 ids per call. An id that matches nothing is simply absent, so `match_count` can be lower than the number of ids sent.

**Required:**
- `business_ids` (array) — comma-separated, up to 500 `business_id` values. Example: `0x102b644d009e013:0xea49e9ee285fa7bf`

**Optional:**
- `fields` (string) — comma-separated projection; the search fields plus `business_services`, `price_tier`, `menu`, `photo_tabs`, `popular_times`

**Pagination:** none (batch up to 500 ids per call)
**Response path:** `data.businesses`
**Key fields:** every search field, plus business_services, price_tier, menu, photo_tabs, popular_times
**Also in `data`:** match_count

---

### GET /business-reviews
Business Reviews

A business's reviews, read live from Google Maps at request time. Pagination only works with `limit` left at its maximum of 20: below that a single trimmed page is returned with no `cursor`.

**Required:**
- `business_id` (string) — Example: `0x102b644d009e013:0xea49e9ee285fa7bf`

**Optional:**
- `limit` (integer) — range: 1-20 (a `cursor` is only returned at 20)
- `cursor` (string) — the `cursor` from the previous response
- `sort_by` (string, default: most_relevant) — values: most_relevant, newest, highest_ranking, lowest_ranking
- `language` (string, default: en) — ISO 639-1 code
- `region` (string, default: us) — ISO 3166-1 alpha-2 code

**Pagination:** cursor (param: `cursor`, 20 reviews per page)
**Response path:** `data.reviews`
**Key fields:** review_id, review_text, rating, review_datetime_utc, review_timestamp, review_time, review_link, review_photos, review_language, review_text_translated, review_text_translated_language, like_count, author_id, author_link, author_name, author_photo_url, author_review_count, author_photo_count, author_reviews_link, author_is_local_guide, owner_response_time, owner_response_text, owner_response_language, service_quality, review_form, review_source, review_source_logo
**Also in `data`:** business_id, found, match_count (reviews on this page, not the business total), limit

---

### GET /business-photos
Business Photos

A business's photos, read live from Google Maps at request time. `limit` is a maximum: a business with fewer photos returns fewer. The end is reached when a page comes back empty or without a `cursor`. A `limit` above 10 currently fails with `502 UPSTREAM_UNAVAILABLE`, so page 10 at a time (scrape.js does).

**Required:**
- `business_id` (string) — Example: `0x102b644d009e013:0xea49e9ee285fa7bf`

**Optional:**
- `limit` (integer) — range: 1-100 (use 10 or less, see above)
- `cursor` (string) — the `cursor` from the previous response
- `language` (string, default: en) — ISO 639-1 code
- `region` (string, default: us) — ISO 3166-1 alpha-2 code

**Pagination:** cursor (param: `cursor`)
**Page size param:** `limit` (max 100 per spec, 10 in practice)
**Response path:** `data.photos`
**Key fields:** photo_id, photo_url, photo_url_large, video_thumbnail_url, type (photo, street_view, video), latitude, longitude, photo_datetime_utc, photo_timestamp
**Also in `data`:** business_id, found, match_count (photos on this page), limit

---
