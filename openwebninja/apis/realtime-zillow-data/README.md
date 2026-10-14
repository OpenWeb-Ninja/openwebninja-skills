# realtime-zillow-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_zillow_data.yaml

**Host:** `real-time-real-estate-data.p.rapidapi.com`
**Notes:** Fixed ~41 results per page.

## Endpoints

### GET /search
Search

**Required:**
- `location` (string) Example: `Los Angeles, CA`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `home_status` (string, default: FOR_SALE) — values: FOR_SALE, FOR_RENT, RECENTLY_SOLD
- `home_type` (string) Example: `HOUSES`
- `space_type` (string)
- `sort` (string, default: DEFAULT) Example: `NEWEST`
- `min_price` (number) Example: `0`
- `max_price` (number) Example: `0`
- `min_monthly_payment` (number) Example: `0`
- `max_monthly_payment` (number) Example: `0`
- `min_bedrooms` (number) Example: `0`
- `max_bedrooms` (number) Example: `0`
- `min_bathrooms` (number) Example: `0`
- `max_bathrooms` (number) Example: `0`
- `min_sqft` (number) Example: `0`
- `max_sqft` (number) Example: `0`
- `min_lot_size` (number)
- `max_lot_size` (number)
- `listing_type` (string, default: BY_AGENT)
- `for_sale_by_agent` (boolean, default: true) Example: `true`
- `for_sale_by_owner` (boolean, default: true) Example: `true`
- `for_sale_is_new_construction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosure` (boolean, default: true) Example: `true`
- `for_sale_is_auction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosed` (boolean, default: false) Example: `true`
- `for_sale_is_preforeclosure` (boolean, default: false) Example: `true`
- `max_hoa_fee` (number, default: ANY FEE) Example: `0`
- `includes_homes_no_hoa_data` (boolean, default: true) Example: `true`

**Pagination:** page_number (param: `page`)

---

### GET /search-coordinates
Search by Coordinates

**Required:**
- `long` (number) Example: `-118.504744`
- `lat` (number) Example: `34.01822`

**Optional:**
- `diameter` (number, default: 1) Example: `1.0`
- `page` (number, default: 1) Example: `1`
- `home_status` (string, default: FOR_SALE) — values: FOR_SALE, FOR_RENT, RECENTLY_SOLD
- `home_type` (string) Example: `HOUSES`
- `space_type` (string)
- `sort` (string, default: DEFAULT) Example: `NEWEST`
- `min_price` (number) Example: `0`
- `max_price` (number) Example: `0`
- `min_monthly_payment` (number) Example: `0`
- `max_monthly_payment` (number) Example: `0`
- `min_bedrooms` (number) Example: `0`
- `max_bedrooms` (number) Example: `0`
- `min_bathrooms` (number) Example: `0`
- `max_bathrooms` (number) Example: `0`
- `min_sqft` (number) Example: `0`
- `max_sqft` (number) Example: `0`
- `min_lot_size` (number)
- `max_lot_size` (number)
- `listing_type` (string, default: BY_AGENT)
- `for_sale_by_agent` (boolean, default: true) Example: `true`
- `for_sale_by_owner` (boolean, default: true) Example: `true`
- `for_sale_is_new_construction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosure` (boolean, default: true) Example: `true`
- `for_sale_is_auction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosed` (boolean, default: false) Example: `true`
- `for_sale_is_preforeclosure` (boolean, default: false) Example: `true`
- `max_hoa_fee` (number, default: ANY FEE) Example: `0`
- `includes_homes_no_hoa_data` (boolean, default: true) Example: `true`

**Pagination:** page_number (param: `page`)

---

### GET /search-polygon
Search by Polygon

**Required:**
- `polygon` (string) Pairs of `longitude latitude` (longitude first), comma-separated. Format: `lng1 lat1,lng2 lat2,lng3 lat3,...`. Closed automatically. Example: `-118.50 34.03,-118.47 34.03,-118.47 34.00,-118.50 34.00`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `home_status` (string, default: FOR_SALE) — values: FOR_SALE, FOR_RENT, RECENTLY_SOLD
- `home_type` (string) Example: `HOUSES`
- `space_type` (string)
- `sort` (string, default: DEFAULT) Example: `NEWEST`
- `min_price` (number) Example: `0`
- `max_price` (number) Example: `0`
- `min_monthly_payment` (number) Example: `0`
- `max_monthly_payment` (number) Example: `0`
- `min_bedrooms` (number) Example: `0`
- `max_bedrooms` (number) Example: `0`
- `min_bathrooms` (number) Example: `0`
- `max_bathrooms` (number) Example: `0`
- `min_sqft` (number) Example: `0`
- `max_sqft` (number) Example: `0`
- `min_lot_size` (number)
- `max_lot_size` (number)
- `listing_type` (string, default: BY_AGENT)
- `for_sale_by_agent` (boolean, default: true) Example: `true`
- `for_sale_by_owner` (boolean, default: true) Example: `true`
- `for_sale_is_new_construction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosure` (boolean, default: true) Example: `true`
- `for_sale_is_auction` (boolean, default: true) Example: `true`
- `for_sale_is_foreclosed` (boolean, default: false) Example: `true`
- `for_sale_is_preforeclosure` (boolean, default: false) Example: `true`
- `max_hoa_fee` (number, default: ANY FEE) Example: `0`
- `includes_homes_no_hoa_data` (boolean, default: true) Example: `true`

**Pagination:** page_number (param: `page`)

---

### GET /property-details
Property Details — Get property details by Zillow property ID (zpid) or Zillow property URL.

**Required:** one of `zpid` or `url`

**Optional:**
- `zpid` (string) Example: `7594920`
- `url` (string) Example: `https://www.zillow.com/homedetails/15626-Laurel-Heights-Dr-Houston-TX-77084/28253016_zpid/`

**Pagination:** none

---

### GET /property-details-address
Property by Address

**Required:**
- `address` (string) Example: `1161 Natchez Dr College Station Texas 77845`

**Pagination:** none

---

### GET /zestimate
Property Zestimate

**Required:**
- `zpid` (string) Example: `28253016`

**Optional:**
- `url` (string) Example: `https://www.zillow.com/homedetails/15626-Laurel-Heights-Dr-Houston-TX-77084/28253016_zpid/`

**Pagination:** none

---

### GET /agent-search
Agent Search — Search real estate agents by location and optionally by name. Returns the `encodedZuid` used by the agent listing endpoints.

**Required:**
- `location` (string) — Location slug in city-state format Example: `new-york-ny`

**Optional:**
- `name` (string) — Filter agents by name Example: `john`
- `page` (number, default: 1) Example: `1`

**Pagination:** page_number (param: `page`), up to 15 agents per page
**Response path:** `data` (agents in `data.agents[]`, total in `data.total_agents`)
**Key fields:** encodedZuid, cardTitle, cardActionLink, imageUrl, isTopAgent, secondaryCardTitle, profileData, reviewInformation, tags

---

### GET /agent-properties-for-sale
Agent Properties (For Sale) — Get an agent's current active for-sale listings.

**Required:**
- `encodedZuid` (string) — From Agent Search Example: `X1-ZUxs6j84n4ak95_3mmvm`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `include_team` (boolean) — accepted for compatibility; it has no effect (Zillow's profile data no longer separates team listings)

**Pagination:** page_number (param: `page`), up to 5 listings per page
**Response path:** `data` (listings in `data.listings[]`; `data.listing_count` is always null, Zillow no longer exposes the total: page until a page comes back short)
**Key fields:** zpid, address, bedrooms, bathrooms, price, brokerage_name, home_marketing_type, primary_photo_url, listing_url (home_type, status, coordinates, currency and open houses are always null now)

---

### GET /agent-properties-sold
Agent Properties (Sold) — Get an agent's past sales history.

**Required:**
- `encodedZuid` (string) — From Agent Search Example: `X1-ZUxs6j84n4ak95_3mmvm`

**Optional:**
- `page` (number, default: 1) — values: 1-20 Example: `1`

**Pagination:** page_number (param: `page`), up to 5 sales per page
**Response path:** `data` (sales in `data.sold_properties[]`; `data.total_sold_properties` is always null, Zillow no longer exposes the total)
**Key fields:** zpid, represented, sold_date, price, street_address, city, state, city_state_zipcode, bedrooms, bathrooms, livingAreaValue, image_url, home_details_url (coordinates are always null now)

---

### GET /agent-properties-for-rent
Agent Properties (For Rent) — Get an agent's current rental listings.

**Required:**
- `encodedZuid` (string) — From Agent Search Example: `X1-ZU12j0quxoelgjt_uwi3`

**Optional:**
- `page` (number, default: 1) Example: `1`
- `include_team` (boolean) — accepted for compatibility; it has no effect (Zillow's profile data no longer separates team listings)

**Pagination:** page_number (param: `page`), up to 5 listings per page
**Response path:** `data` (listings in `data.listings[]`; `data.listing_count` is always null, Zillow no longer exposes the total: page until a page comes back short)
**Key fields:** zpid, address, bedrooms, bathrooms, price, brokerage_name, home_marketing_type, primary_photo_url, listing_url (home_type, coordinates and currency are always null now)

---
