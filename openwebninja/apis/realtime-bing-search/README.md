# realtime-bing-search

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_bing_search_data.yaml

**Host:** `real-time-bing-search.p.rapidapi.com`

Fast and Reliable Bing Search API (SERP) - Web, News, Images, Videos, Shopping, Product and Maps Results from Microsoft Bing in Real-Time.

Every endpoint is billed as one request per call. A search that finds nothing is a `200` with an empty result array.

## Endpoints

### GET /search
Search

Organic web results from Bing's first results page (up to 10), plus Bing's estimated result count when its page shows one (often null). Bing's click-tracking redirect is unwrapped, so `link` is the publisher's own URL. Video results (YouTube, TikTok) link to Bing's video viewer.

**Required:**
- `query` (string) Example: `how to make sourdough bread`

**Optional:**
- `country` (string, default: us) — ISO 3166-1 alpha-2, sets Bing's market
- `language` (string, default: en) — ISO 639-1 interface language
- `time_period` (string, default: any) — values: any, last_day, last_week, last_month, last_year
- `safe_search` (string, default: off) — values: off, moderate, strict

**Pagination:** none (up to 10 results)
**Response path:** `data.organic_results`
**Key fields:** title, link, displayed_link, source, domain, snippet, date, position
**Also in `data`:** total_organic_results (nullable)

---

### GET /news
News Search

Bing News articles from publishers worldwide, sorted by relevance or date. A broad query returns about 190 articles, a narrow one fewer. Pages past the end of the list can repeat its last articles, and neighbouring pages can share an article.

**Required:**
- `query` (string) Example: `nvidia`

**Optional:**
- `page` (integer, default: 1) — range: 1-20, up to 10 articles per page
- `country` (string, default: us) — ISO 3166-1 alpha-2, sets the news market (local publishers)
- `language` (string, default: en) — ISO 639-1, sets the language of `published_date`
- `sort_by` (string, default: RELEVANCE) — values: RELEVANCE, DATE (newest first)
- `time_period` (string, default: any) — values: any, last_hour, last_day, last_week, last_month. Combines with `sort_by`

**Pagination:** page_number (param: `page`, max 20)
**Page size:** up to 10 (no page-size param)
**Response path:** `data.news`
**Key fields:** title, link, snippet, source_name, source_logo_url, thumbnail_url, published_date, published_datetime_utc, position

---

### GET /images
Image Search

Bing Images with Bing's own filters; filters combine freely (e.g. `color=red&aspect_ratio=wide`). Bing's image list ends at about 550 results. `position` is Bing's own rank in that list, so page 2 starts at 36. Neighbouring pages can share a few images.

**Required:**
- `query` (string) Example: `golden retriever puppy`

**Optional:**
- `page` (integer, default: 1) — range: 1-16, up to 35 images per page
- `country` (string, default: us) — ISO 3166-1 alpha-2, sets Bing's market
- `language` (string, default: en) — ISO 639-1 interface language
- `size` (string, default: any) — values: any, small, medium, large, wallpaper
- `color` (string, default: any) — values: any, full, grayscale, red, orange, yellow, green, teal, blue, purple, pink, brown, black, gray, white. `full` = color images only, `grayscale` = black and white only
- `type` (string, default: any) — values: any, photo, clipart, lineart, animated, transparent. `animated` = animated GIFs, `transparent` = transparent background
- `aspect_ratio` (string, default: any) — values: any, square, wide, tall
- `people` (string, default: any) — values: any, face, portrait
- `time_period` (string, default: any) — values: any, last_day, last_week, last_month, last_year
- `usage_rights` (string, default: any) — values: any, creative_commons, public_domain, free_to_share, free_to_share_commercially, free_to_modify, free_to_modify_commercially. `public_domain` and `creative_commons` return largely the same images, as do the two `_commercially` values
- `safe_search` (string, default: off) — values: off, moderate, strict

**Pagination:** page_number (param: `page`, max 16)
**Page size:** up to 35 (no page-size param)
**Response path:** `data.images`
**Key fields:** id, title, url, width, height, background_color, thumbnail_url, thumbnail_width, thumbnail_height, source, source_url, source_domain, position

---

### GET /videos
Video Search

Bing Videos across YouTube, TikTok, Dailymotion, Vimeo and every other site Bing indexes. Filters combine freely (e.g. `duration=short&time_period=last_month`). Bing's video list ends at 140 results; page 1 usually holds 30. Neighbouring pages can share a few videos.

**Required:**
- `query` (string) Example: `python tutorial for beginners`

**Optional:**
- `page` (integer, default: 1) — range: 1-4, up to 35 videos per page
- `country` (string, default: us) — ISO 3166-1 alpha-2, sets Bing's market
- `language` (string, default: en) — ISO 639-1, sets the language of `views_text` and `published_date` (`published_datetime_utc` is parsed for `en`)
- `duration` (string, default: any) — values: any, short (under 5 min), medium (5-20 min), long (over 20 min)
- `time_period` (string, default: any) — values: any, last_day, last_week, last_month, last_year
- `source_site` (string) — only videos hosted on this domain, e.g. `youtube.com`, `tiktok.com`, `dailymotion.com`, `vimeo.com`. A full URL is reduced to its domain
- `safe_search` (string, default: off) — values: off, moderate, strict

**Pagination:** page_number (param: `page`, max 4)
**Page size:** up to 35 (no page-size param)
**Response path:** `data.videos`
**Key fields:** id, title, link, source, channel_name, channel_url, thumbnail_url, duration, duration_seconds, views, views_text, published_date, published_datetime_utc, position

---

### GET /shopping
Shopping Search

Bing Shopping products across stores, with price sort and price range filters. Each product carries a `product_id` to pass to `/product-details`. Products from Bing's paid product grid are returned separately in `sponsored_products`; on some markets (e.g. Japan, Brazil, Canada) Bing often shows only that grid. `country` sets the stores, prices and currency. Bing Shopping serves `language=en` and the market's own language only: another pair (e.g. `country=us&language=es`) or a country without Bing Shopping returns a 400.

**Required:**
- `query` (string) Example: `coffee maker`

**Optional:**
- `page` (integer, default: 1) — range: 1-9. Most markets show 36 products per page (pages 1-5 hold results); Bing's list layout shows 20 per page (up to page 9)
- `country` (string, default: us) — ISO 3166-1 alpha-2 market
- `language` (string, default: en) — `en` or the market's own language
- `sort_by` (string, default: BEST_MATCH) — values: BEST_MATCH, LOWEST_PRICE, HIGHEST_PRICE
- `min_price` (number) — at or above this `extracted_price`, in the currency of `country`. A page with no product in range returns 404
- `max_price` (number) — at or below this `extracted_price`, in the currency of `country`. A page with no product in range returns 404

**Pagination:** page_number (param: `page`, max 9). Up to about 180 products per query; a page past the end returns a `200` with empty arrays
**Page size:** 36 (20 on Bing's list layout), no page-size param
**Response path:** `data.products` (paid grid in `data.sponsored_products`, same fields)
**Key fields:** product_id, offer_id, product_title, price, extracted_price, original_price, extracted_original_price, currency, on_sale, installment_down_payment, installment_monthly_payment, installment_months, product_condition, offer_badge, product_rating, product_num_reviews, store_name, store_favicon, shipping, product_photo, product_page_url, offer_page_url, sponsored, position

---

### GET /product-details
Product Details

Full Bing Shopping product page for a `product_id` returned by `/shopping`: description, photos, specifications, variants, Bing's review insights (rating, star distribution, highlights, AI-written summary, pros and cons) and every store offering it. A product belongs to the market it was found on, so `country` defaults to the market inside the `product_id`. A product Bing no longer lists returns a 404; an id not returned by `/shopping` returns a 400.

**Required:**
- `product_id` (string) — as returned in `product_id` by `/shopping`. Example: `MXx1c3wxN3wzfDA3MDc4NjJEN0FEQkU2NTY3OEFBMzIyQzkwNEJCQUMyfDQyODcwMDgwOTA3OXxjb2ZmZWUgbWFrZXI`

**Optional:**
- `country` (string) — ISO 3166-1 alpha-2 market to load the product on. Leave empty to use the market the `product_id` was found on
- `language` (string, default: en) — ISO 639-1, sets the language of `review_summary`, `review_pros` and `review_cons` (Bing writes these for some products only in the market's own language)

**Pagination:** none
**Response path:** `data`
**Key fields:** product_id, offer_id, product_title, product_description, product_photos, price, extracted_price, original_price, extracted_original_price, currency, min_price, max_price, availability, product_rating, product_num_reviews, rating_distribution (1-5), review_highlights, review_summary, review_pros, review_cons, variants (name, options[value, selected, thumbnail_url]), specifications (name, value), product_page_url, offers_count, offers
**Offer fields:** store_name, store_favicon, price, extracted_price, original_price, extracted_original_price, currency, installment_down_payment, installment_monthly_payment, installment_months, shipping, offer_note, sponsored, offer_page_url, position

---

### GET /maps
Maps Search

Bing Maps local places: businesses, restaurants, hotels, landmarks and addresses. Always give the search a location, inside `query` (`coffee in new york`) or as `lat` + `lng`; a query with neither is centred on a default city. A query naming a single place (e.g. a landmark) returns that one place. Bing's local list holds about 40 to 70 places per query. Neighbouring pages can share a few places.

**Required:**
- `query` (string) — including the location unless `lat`/`lng` are set. Example: `coffee new york`

**Optional:**
- `limit` (integer, default: 20) — range: 1-50, places per page
- `page` (integer, default: 1) — `page` x `limit` must stay within 100 (with `limit=20` the last page is 5)
- `country` (string, default: us) — ISO 3166-1 alpha-2, sets Bing's market
- `language` (string, default: en) — ISO 639-1, sets the language of `opening_status`
- `lat` (number) — range: -90 to 90, use with `lng`. Example: `34.0522`
- `lng` (number) — range: -180 to 180, use with `lat`. Example: `-118.2437`

**Pagination:** page_number (param: `page`, `page` x `limit` <= 100)
**Page size param:** `limit` (default: 20, max 50)
**Response path:** `data.places`
**Key fields:** place_id, name, full_address, latitude, longitude, phone_number, website, type, rating, review_count, rating_source, opening_status, service_options, thumbnail_url, position

---
