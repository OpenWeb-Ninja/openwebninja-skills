# company-database

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/company_data.yaml

**Host:** `api.openwebninja.com/company-database` (no RapidAPI listing: use an OpenWeb Ninja `ak_` key)

Fast, Reliable, and Searchable Glassdoor Company Data - Search Companies by Name, Website Domain, Industry, Company Type, Headcount Band, Founding Year, Stock Ticker, HQ Country or Description, and Get Full Company Profiles with Ratings, Review Counts, Revenue, Size & Mission.

**When to use it:** building company datasets in bulk, or enriching a list of domains, tickers or names with Glassdoor profiles. It returns every company matching the filters (with the exact total in `match_count`), up to 500 per call. Every record carries `first_seen` and `last_seen`. For live Glassdoor employee reviews, salaries, interviews and job listings of a company, use `realtime-glassdoor-data` instead.

## Endpoints

### GET /search
Search

Search company records by any combination of the filter parameters below. At least one filter is required: a request with none returns `400` with an `error.message` ending in `(NO_QUERY_FIELDS)`. Filters combine with AND, and the values of one filter with OR. A query that matches nothing returns `200` with an empty `companies` array.

**Order:** when `name` is sent, records come by how well they match it; otherwise in `employer_id` order, compared as text (`10005970` sorts before `1651`).

**Filter parameters** (all optional, at least one required; shared by `GET` and `POST /search`). Multi-value filters take up to 20 values: comma-separated, or the parameter repeated. `industry` can only be repeated (a comma can be part of the value), or sent as an array in `POST /search`.
- `name` (string) - full-text match on the company name. Example: `Microsoft`
- `employer_id` (array) - exact match on the record's `employer_id`. Example: `1651,9079`
- `website_domain` (array) - a URL, `www.` host or bare host, reduced to the bare domain before matching. Example: `microsoft.com,siemens.com`
- `industry` (array) - industry name. One value also matches word-form variants; several values match exactly. Repeat-only. Example: `Software Development`
- `industry_id` (array) - industry identifier. Example: `200063,200064`
- `sector_id` (array) - sector identifier. Example: `10013,10015`
- `company_type` (array) - type code: PUBLIC, PRIVATE, SUBSIDIARY, NONPROFIT, GOVERNMENT, UNIVERSITY, SCHOOL, HOSPITAL, PRIVATE_PRACTICE, FRANCHISE, CONTRACT, SELF_EMPLOYED. Example: `PUBLIC,SUBSIDIARY`
- `size_category` (array) - headcount band: SMALL (1-50), SMALL_TO_MEDIUM (51-200), MEDIUM (201-500), MEDIUM_TO_LARGE (501-1,000), LARGE (1,001-5,000), LARGE_TO_GIANT (5,001-10,000), GIANT (10,000+). Example: `LARGE,LARGE_TO_GIANT`
- `size_category_min` / `size_category_max` (string) - smallest / largest headcount band, inclusive, one label each. Example: `MEDIUM`
- `year_founded_min` / `year_founded_max` (integer) - founding year range, inclusive. Example: `1950`, `2000`
- `stock_ticker` (array) - case-insensitive exact match. Example: `MSFT,NVDA`
- `hq_country` (array) - ISO 3166-1 alpha-2 code of the headquarters. Example: `US,DE`
- `description` (string) - full-text match on the company description. Example: `cloud computing`

A company with no value for a range bound (`size_category_min/max`, `year_founded_min/max`) matches no bound.

**Optional:**
- `limit` (integer, default: 20) - range: 1-500, companies per call
- `cursor` (string) - the `cursor` from the previous response (valid for 15 minutes and only for the exact same query)
- `fields` (string) - comma-separated projection (`employer_id` always included). Trims the response only; billing is unchanged. Values: any key listed under Key fields below.

**Pagination:** cursor (param: `cursor`; next value at top-level `cursor`, omitted on the last page). A page below `limit` can still carry a `cursor`, so keep paging until none is returned.
**Page size param:** `limit` (max 500)
**Response path:** `data.companies`
**Key fields:** employer_id, name, website_domain, industry, industry_id, sector_id, company_type, size_category, year_founded, stock_ticker, hq_country, description, rating, review_count, website, revenue, size, mission, logo_url, salary_count, job_count, business_outlook_rating, career_opportunities_rating, compensation_and_benefits_rating, culture_and_values_rating, diversity_and_inclusion_rating, recommend_to_friend_rating, senior_management_rating, work_life_balance_rating, first_seen, last_seen, last_changed
**Also in `data`:** match_count (total matching companies, not the number on this page), limit

Keys with no value are left out of a record. Only `employer_id` is on every record; `last_changed` and `stock_ticker` are the keys most often absent. `rating` and `review_count` are as of `last_seen`; `logo_url`, `salary_count`, `job_count` and the sub-ratings are as of `first_seen` or `last_changed`. `business_outlook_rating` and `recommend_to_friend_rating` are fractions from 0 to 1; the other sub-ratings are 1 to 5. `revenue` and `size` are text bands (`$10+ billion (USD)`, `10000+ Employees`).

**Billing:** one `Companies` unit per record returned (`companies.length`, not `match_count`). An empty page and any error cost 0.

---

### POST /search
Search

Same filters and results as `GET /search`, sent as a JSON body. Use it when the query is too long for a URL, or for several `industry` values. Any multi-value filter can be a JSON array (max 20 items).

**Body (all optional, at least one filter required):**
- every filter parameter of `GET /search`, plus `limit` (1-500), `cursor`, and `fields` (array of field names, one name per element)

Example body: `{"industry": ["Software Development", "Computer Hardware Development"], "hq_country": ["US"], "size_category_min": "LARGE", "limit": 3}`

**Pagination:** cursor (body field `cursor`; next value at top-level `cursor`)
**Response path:** `data.companies`
**Key fields:** same company object as `GET /search`

---
