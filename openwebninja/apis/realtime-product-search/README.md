# realtime-product-search

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_product_search-v2.yaml

**Host:** `real-time-product-search.p.rapidapi.com`
**Notes:** v2 of the API. With an OpenWeb Ninja key the base path is `/realtime-product-search/v2` (meta.json `own_slug`); on RapidAPI the same routes are served at the host root. /search and /deals are page-based: each page holds up to 40 products (`limit` only truncates a page, max 120). Reviews endpoints use cursor pagination (`data.cursor`).

## Endpoints

### GET /search
Product Search

**Required:**
- `q` (string) — Search query / keyword Example: `Nike shoes`

**Optional:**
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`
- `page` (integer, default: 1) — values: 1-100 Example: `1`
- `limit` (integer, default: 40) — values: 1-120 Example: `40`
- `sort_by` (string, default: BEST_MATCH) — values: BEST_MATCH, TOP_RATED, LOWEST_PRICE, HIGHEST_PRICE
- `min_price` (number) — Only return product offers with price greater than a certain value
- `max_price` (number) — Only return product offers with price lower than a certain value
- `product_condition` (string, default: ANY) — values: ANY, NEW, USED, REFURBISHED
- `stores` (string) — single or comma-separated store names Example: `best buy,walmart,amazon`
- `free_returns` (boolean, default: false)
- `free_shipping` (boolean, default: false)
- `on_sale` (boolean, default: false)
- `shoprs` (string) — filter token from the `filters` response field, used together with the updated `q`
- `return_filters` (boolean) — return Google Shopping filters / refinements

**Pagination:** page_number (param: `page`, up to 40 products per page)
**Page size param:** `limit` (default: 40)
**Response path:** `data` (products in `data.products[]`, also `data.sponsored_products[]`, `data.filters[]` when return_filters=true)
**Key fields:** product_id, product_title, price, original_price, on_sale, discount_percent, product_page_url, product_photos, store_name, has_multiple_offers, product_rating, product_num_reviews, shipping

---

### GET /product-details
Product Details

**Required:**
- `product_id` (string) — Product id (from /search) Example: `catalogid:2941335935823932668,productid:,gpcid:6219277726645206819,headlineOfferDocid:6922745083394626272,rds:PC_6219277726645206819|PROD_PC_6219277726645206819,imageDocid:11700829382450873418,mid:576462815432560445,pvt:a,pvf:`

**Optional:**
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** none
**Response path:** `data`
**Key fields:** product_id, product_title, product_description, product_photos, product_videos, product_attributes, product_rating, product_page_url, product_num_reviews, product_num_offers, typical_price_range, product_variants, offer (offer_id, offer_title, offer_page_url, price, shipping, on_sale, original_price, percent_off, product_condition, store_name, store_rating, store_review_count, payment_methods), videos, top_insights, discussions_and_forums

---

### GET /product-offers
Product Offers

**Required:**
- `product_id` (string) — Product id (from /search) Example: `catalogid:2941335935823932668,productid:,gpcid:6219277726645206819,headlineOfferDocid:6922745083394626272,rds:PC_6219277726645206819|PROD_PC_6219277726645206819,imageDocid:11700829382450873418,mid:576462815432560445,pvt:a,pvf:`

**Optional:**
- `page` (integer, default: 1) Example: `1`
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** page_number (param: `page`; each page holds offers from 10 sellers)
**Response path:** `data` (offers in `data.offers[]`)
**Key fields:** offer_id, offer_title, offer_page_url, price, original_price, on_sale, percent_off, shipping, returns, offer_badge, product_condition, store_name, merchant_id, store_rating, store_review_count, store_reviews_page_url, store_favicon, payment_methods

---

### GET /product-price-history-v2
Product Price History

**Required:**
- `product_id` (string) — Product id (from /search) Example: `catalogid:2941335935823932668,productid:,gpcid:6219277726645206819,headlineOfferDocid:6922745083394626272,rds:PC_6219277726645206819|PROD_PC_6219277726645206819,imageDocid:11700829382450873418,mid:576462815432560445,pvt:a,pvf:`

**Optional:**
- `page` (integer, default: 1) Example: `1`
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** page_number (param: `page`; page 1 = top offers, next pages = more stores)
**Response path:** `data` (offers in `data.offers[]`, each with `price_history`)
**Key fields:** product_id, product_title, product_rating, product_num_offers, offers (offer_id, offer_title, price, original_price, store_name, merchant_id, price_history)

---

### GET /product-reviews
Product Reviews

**Required:**
- `product_id` (string) — Product id (from /search) Example: `catalogid:8425421641323327810,gpcid:1261873578657646759,headlineOfferDocid:6367138647863486978,rds:PC_1261873578657646759|PROD_PC_1261873578657646759,imageDocid:17958223083723421156,mid:576462516936404275,pvt:hg,pvf:`

**Optional:**
- `limit` (integer, default: 10) — values: 1-100 Example: `10`
- `cursor` (string)
- `sort_by` (string, default: MOST_RELEVANT) — values: MOST_RELEVANT, MOST_RECENT
- `rating` (string, default: 0) — only reviews rated above this value, 1-5 Example: `0`
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** cursor (param: `cursor`; next value in `data.cursor`)
**Page size param:** `limit` (default: 10)
**Response path:** `data` (reviews in `data.reviews[]`)
**Key fields:** product_rating, product_num_reviews, reviews_per_rating, cursor, reviews (review_id, review_title, rating, review_text, review_date, review_datetime_utc, review_author, review_author_photo, review_source, review_source_url)

---

### GET /deals
Deals

**Required:**
- `q` (string) — Search query / keyword Example: `Laptop`

**Optional:**
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`
- `page` (integer, default: 1) — values: 1-100 Example: `1`
- `limit` (integer, default: 40) — values: 1-120 Example: `40`
- `sort_by` (string, default: BEST_MATCH) — values: BEST_MATCH, TOP_RATED, LOWEST_PRICE, HIGHEST_PRICE
- `min_price` (number) — Only return product offers with price greater than a certain value
- `max_price` (number) — Only return product offers with price lower than a certain value
- `product_condition` (string, default: ANY) — values: ANY, NEW, USED, REFURBISHED
- `stores` (string) — single or comma-separated store names
- `free_returns` (boolean, default: false)
- `free_shipping` (boolean, default: false)
- `on_sale` (boolean, default: false)
- `shoprs` (string)
- `return_filters` (boolean)

**Pagination:** page_number (param: `page`, up to 40 products per page)
**Page size param:** `limit` (default: 40)
**Response path:** `data` (products in `data.products[]`)
**Key fields:** product_id, product_title, price, original_price, on_sale, discount_percent, product_page_url, product_photos, store_name, product_rating, product_num_reviews, shipping

---

### GET /store-reviews
Store Reviews — Get all store / merchant reviews with pagination/scrolling support using the cursor and limit parameters.

**Required:**
- `store_domain` (string) — The domain of the (TLD) of the store for which to get reviews (e.g. amazon.com). Example: `amazon.com`

**Optional:**
- `limit` (integer, default: 10) — values: 1-100 Example: `10`
- `cursor` (string)
- `rating` (string) Example: `ALL`
- `sort_by` (string, default: MOST_HELPFUL) — values: MOST_HELPFUL, MOST_RECENT
- `time_frame` (string, default: ALL) — values: ALL, ONE_YEAR, TWO_YEARS, SIX_MONTHS, THREE_MONTHS
- `country` (string, default: us) Example: `us`
- `language` (string, default: en) Example: `en`

**Pagination:** cursor (param: `cursor`; next value in `data.cursor`)
**Page size param:** `limit` (default: 10)
**Response path:** `data` (reviews in `data.reviews[]`)
**Key fields:** store_rating, store_num_reviews, cursor, reviews (review_text, rating, review_author, review_author_photo, review_datetime_utc)

---
