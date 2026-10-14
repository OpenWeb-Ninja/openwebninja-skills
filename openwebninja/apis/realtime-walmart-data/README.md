# realtime-walmart-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_walmart_data.yaml

**Host:** `real-time-walmart-data1.p.rapidapi.com`

## Endpoints

### GET /search
Product Search

**Required:**
- `query` (string) Example: `laptop`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `sort_by` (string, default: best_match) — values: best_match, price_low, price_high, best_seller, top_rated
- `min_price` (number) Example: `10`
- `max_price` (number) Example: `500`
- `store_id` (string) — Walmart store ID for store-specific prices and availability. Applied for domain `ca` only (e.g. `3148`, Lévis, QC; walmart.ca defaults to store 1061); not applied for domain `us`. The response `location` object confirms the store applied. Example: `3148`
- `facet` (string) — Facet filter string (e.g. brand, category) from a previous search response's facet data.
- `domain` (string, default: us) — values: us, ca
- `state` (string) — US state code to localize availability and shipping. Example: `CA`

**Pagination:** page_number (param: `page`, `data.total_pages` reported)
**Page size:** fixed 40 (no page-size param)
**Response path:** `data` (products in `data.products[]`)
**Key fields:** position, product_id, us_item_id, title, description, brand, price, list_price, currency, currency_symbol, price_display, min_price, max_price, savings_amount, price_per_unit_amount, price_per_unit_type, primary_offer, image, thumbnail, url, rating, review_count, availability, out_of_stock, preorder, seller, seller_id, pickup, delivery_from_store, shipping, shipping_days, two_day_shipping, free_shipping, free_shipping_with_walmart_plus, sponsored, multiple_options_available, badge_flags, best_seller

---

### GET /products-by-category
Products By Category

**Required:**
- `category_id` (string) Example: `3944`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `sort_by` (string, default: best_match) — values: best_match, price_low, price_high, best_seller, top_rated
- `max_price` (number) Example: `500`
- `min_price` (number) Example: `10`
- `store_id` (string) — Walmart store ID for store-specific prices and availability. Applied for domain `ca` only (e.g. `3148`, Lévis, QC; walmart.ca defaults to store 1061); not applied for domain `us`. The response `location` object confirms the store applied. Example: `3148`
- `facet` (string) — Facet filter string (e.g. brand, category).
- `domain` (string, default: us) — values: us, ca
- `state` (string) — US state code to localize results. Example: `CA`
- `zip` (string) — ZIP / postal code to localize results. Example: `90210`

**Pagination:** page_number (param: `page`, `data.total_pages` reported)
**Page size:** fixed 40 (no page-size param)
**Response path:** `data` (products in `data.products[]`)
**Key fields:** position, product_id, us_item_id, title, description, brand, price, list_price, currency, currency_symbol, price_display, min_price, max_price, savings_amount, price_per_unit_amount, price_per_unit_type, primary_offer, image, thumbnail, url, rating, review_count, availability, out_of_stock, preorder, seller, seller_id, pickup, delivery_from_store, shipping, shipping_days, two_day_shipping, free_shipping, free_shipping_with_walmart_plus, sponsored, multiple_options_available, badge_flags, best_seller

---

### GET /product-details
Product Details

**Required:**
- `product_id` (string) Example: `609040889`

**Optional:**
- `domain` (string, default: us) — values: us, ca
- `store_id` (string) — Walmart store ID for store-specific prices and availability. Applied for domain `ca` only (e.g. `3148`, Lévis, QC; walmart.ca defaults to store 1061); not applied for domain `us`. The response `location` object confirms the store applied. Example: `3148`

**Pagination:** none
**Response path:** `data`
**Key fields:** product_id, us_item_id, title, brand, model, upc, type, url, short_description, long_description, price, list_price, currency, price_display, savings_amount, price_per_unit_amount, primary_offer, image, images, rating, review_count, rating_breakdown, recommended_percentage, top_positive_review, top_negative_review, availability, out_of_stock, condition, seller, seller_id, seller_type, fulfillment_type, return_returnable, return_window_days, categories (name, url), specifications (name, value), product_highlights, variants (name, values), warranty_text, snap_eligible, wfs_enabled, location

---

### GET /product-offers
Product Offers

**Required:**
- `product_id` (string) Example: `609040889`

**Optional:**
- `domain` (string, default: us) — values: us, ca
- `store_id` (string) — Walmart store ID for store-specific prices and availability. Applied for domain `ca` only (e.g. `3148`, Lévis, QC; walmart.ca defaults to store 1061); not applied for domain `us`. The response `location` object confirms the store applied. Example: `3148`

**Pagination:** none
**Response path:** `data` (offers in `data.offers[]`; also product_id, title, total_offers, additional_offers_available, location)
**Key fields:** position, offer_id, offer_type, seller_id, seller_name, seller_display_name, seller_type, catalog_seller_id, storefront_url, price, price_display, currency, currency_symbol, availability_status, in_stock, condition, free_shipping, shipping_price, delivery_date, pickup_available, return_policy, wfs_enabled

---

### GET /product-reviews
Product Reviews

**Required:**
- `product_id` (string) Example: `609040889`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `domain` (string, default: us) — values: us, ca
- `rating` (number, default: 5) — Only return reviews with this star rating (1-5). Example: `1`
- `limit` (number, default: 10) — Reviews per page (1-50). Example: `10`
- `sort` (string, default: relevancy) — values: relevancy, recent, rating_high_low, rating_low_high

**Pagination:** page_number (param: `page`, 1-100, `data.total_pages` reported)
**Page size param:** `limit` (default: 10, max: 50)
**Response path:** `data` (reviews in `data.reviews[]`; also rating, ratings_count, review_count, rating_breakdown, recommended_percentage, top_positive_review, top_negative_review)
**Key fields:** position, id, title, body, rating, date, author, top_reviewer, positive_feedback, negative_feedback, source, badges, media

---
