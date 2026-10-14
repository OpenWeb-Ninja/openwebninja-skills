# jsearch

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/jsearch.yaml

**Host:** `jsearch.p.rapidapi.com`
**Notes:** Job search is /search-v2 (the old /search is no longer in the spec). Cursor-based pagination: pass `data.cursor` as `cursor`. Up to 10 jobs per page; `num_pages` (1-20) returns several pages in one call and each page consumes one request credit.

## Endpoints

### GET /search-v2
Job Search — Search jobs posted on any public job site across the web (Google for Jobs), with cursor-based pagination.

**Required:**
- `query` (string) — Free-form query, include job title and location Example: `developer jobs in chicago`

**Optional:**
- `cursor` (string) — The `data.cursor` value from the previous response (omit for the first page)
- `num_pages` (integer, default: 1) — Pages to return in one call, values: 1-20 (each page of up to 10 jobs consumes one request credit) Example: `1`
- `country` (string, default: us) Example: `us`
- `language` (string) Example: `en`
- `date_posted` (string, default: all) — values: all, today, 3days, week, month
- `work_from_home` (boolean, default: false) Example: `false`
- `employment_types` (string) — values: FULLTIME, CONTRACTOR, PARTTIME, INTERN
- `job_requirements` (string) — values: under_3_years_experience, more_than_3_years_experience, no_experience, no_degree
- `radius` (number) Example: `1`
- `exclude_job_publishers` (string) Example: `BeeBe,Dice`
- `fields` (string) Example: `employer_name,job_publisher,job_title,job_country`

**Pagination:** cursor (param: `cursor`, next value in `data.cursor`)
**Response path:** `data` (jobs in `data.jobs[]`)
**Key fields:** job_id, job_title, employer_name, employer_website, job_publisher, job_employment_type, job_apply_link, job_apply_is_direct, apply_options, job_description, job_is_remote, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_salary, job_min_salary, job_max_salary, job_salary_period, job_highlights

---

### GET /job-details
Job Details

**Required:**
- `job_id` (string) Example: `gcnkkB1_QjIlxbV9AAAAAA==`

**Optional:**
- `country` (string, default: us) Example: `us`
- `language` (string) Example: `en`
- `fields` (string) Example: `employer_name,job_publisher,job_title,job_country`

**Pagination:** none
**Response path:** `data`
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher, job_employment_type, job_apply_link, job_apply_is_direct, job_description, job_is_remote, job_posted_at, job_posted_at_timestamp, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_google_link, job_salary, job_min_salary, job_max_salary, job_salary_period, job_onet_soc, job_onet_job_zone, job_employment_types, apply_options, job_highlights

---

### GET /estimated-salary
Job Salary

**Required:**
- `job_title` (string) — Job title for which to get salary estimation. Example: `nodejs developer`
- `location` (string) — Location in which to get salary estimation. Example: `new york`

**Optional:**
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN
- `fields` (string) Example: `job_title,median_salary,location`

**Pagination:** none
**Response path:** `data`
**Key fields:** location, job_title, min_salary, max_salary, median_salary, min_base_salary, max_base_salary, median_base_salary, min_additional_pay, max_additional_pay, median_additional_pay, salary_period, salary_currency, salary_count, salaries_updated_at, publisher_name, publisher_link, confidence

---

### GET /company-job-salary
Company Job Salary — Get estimated job salaries/pay in a specific company by job title and optionally a location and experience level in years.

**Required:**
- `company` (string) — The company name for which to get salary information (e.g. Amazon). Example: `Amazon`
- `job_title` (string) — Job title for which to get salary estimation. Example: `software developer`

**Optional:**
- `location` (string) — Freetext location/area in which to get salary estimation. Example: `NY`
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN

**Pagination:** none
**Response path:** `data`
**Key fields:** location, job_title, company, min_salary, max_salary, median_salary, min_base_salary, max_base_salary, median_base_salary, min_additional_pay, max_additional_pay, median_additional_pay, salary_period, salary_currency, confidence, salary_count

---
