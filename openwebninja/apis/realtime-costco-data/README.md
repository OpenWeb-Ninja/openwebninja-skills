# realtime-costco-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_costco_data.yaml

**Host:** `real-time-costco-data.p.rapidapi.com`
**Notes:** /search uses offset-based pagination with the `start` param. /product-details is a single call keyed by `product_id` (the `item_number` from /search).

## Endpoints

### GET /search
Search

**Required:**
- `query` (string) Example: `Nike`

**Optional:**
- `country` (string, default: US) — values: US, CA Example: `US`
- `language` (string, default: en-US) — en-US for US; en-CA or fr-CA for CA Example: `en-US`
- `start` (number, default: 0) Example: `0`
- `delivery_location` (string) — ZIP code for country=US (e.g. 98101) or postal code for country=CA (e.g. M4V 2H7). Scopes product availability, fulfilling location, stock status and order quantity limits to that location (prices are national and do not change). When omitted, results are not scoped to any location. Example: `98101`

**Pagination:** offset (param: `start`)
**Response path:** `data` (products in `data.products[]`)
**Key fields:** item_number, name, item_name, description, item_location_pricing_salePrice, item_location_pricing_listPrice, minSalePrice, maxSalePrice, item_location_currencyCode, item_ratings, item_product_review_count, image, categoryPath_ss, Brand_attr, item_location_availability, item_location_stockStatus, isItemInStock, item_location_locationNumber, item_location_fulfillment_restrictions_minQty, item_location_fulfillment_restrictions_maxQty, item_member_only

---

### GET /product-details
Product Details — Get the full details of a specific Costco product by its item id.

**Required:**
- `product_id` (string) — Costco product / item id (the `item_number` field from /search). Example: `1660437`

**Optional:**
- `country` (string, default: US) — values: US, CA Example: `US`
- `language` (string, default: en-US) — en-US for US; en-CA or fr-CA for CA Example: `en-US`
- `delivery_location` (string) — ZIP code for country=US (e.g. 98101) or postal code for country=CA (e.g. M4V 2H7). Scopes product availability, fulfilling location, stock status and order quantity limits to that location (prices are national and do not change). When omitted, results are not scoped to any location. Example: `M4V 2H7`

**Pagination:** none
**Response path:** `data`
**Key fields:** item_number, name, item_name, description, item_product_marketing_features, item_location_pricing_salePrice, item_location_pricing_listPrice, item_location_pricing_pricePerUnit_price, item_location_currencyCode, item_rating_average_value, item_review_count, item_product_review_count, item_buyable, item_member_only, image, images, categoryPath_ss, Brand_attr, deliveryStatus, item_location_availability, item_location_stockStatus, isItemInStock, delivery_location_applied, deliverable_to_location

---
