# realtime-monster-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_monster_data.yaml

**Host:** `real-time-monster-data.p.rapidapi.com`

Fast and Reliable Job Searches, Full Job Details, Company Job Listings, Titles, Employers, Locations, Descriptions, Salaries, Skills, and More on Monster/CareerBuilder in Real-Time.

## Endpoints

### GET /search
Search Jobs

A search row already carries the whole job (description, salary, coordinates, apply link), so `/job-details` is not needed after a search. At most 510 jobs are retrievable per query: `page` is capped at 51 and `page` + `num_pages` - 1 may not pass page 51. Short pages occur inside that window, so only an empty page means the end. `sort_by=date` sorts only the jobs in the current response. Combining `remote_jobs_only` with `employment_types` filters remote locally and returns fewer jobs.

**Billing:** one request per page of 10 actually fetched, plus one extra request for any call with `page` above 1. Fetch several pages per call with `num_pages` instead of one call per page.

**Required:**
- `query` (string) — free-form job search query. Example: `software engineer`

**Optional:**
- `location` (string) — free-text location, e.g. `New York, NY` or `London`. Omit to search country-wide. Required by `radius`.
- `page` (integer, default: 1) — range: 1-51, 10 jobs per page
- `num_pages` (integer, default: 1) — range: 1-20, consecutive pages fetched and concatenated starting at `page`
- `country` (string, default: us) — 2-letter code; selects the Monster locale and market. Jobs exist for us, gb, ca, ie, fr, be, nl, es, se, ch, at, it, lu. Monster has no jobs for de, au, nz, in, sg, hk, ph, my, mx, br (empty array). Other countries run on the en-US locale.
- `language` (string) — language of the `query` text as an `xx-xx` code, e.g. `en-us`, `fr-fr`. Derived from `country` when omitted.
- `sort_by` (string, default: relevance) — values: relevance, date (date sorts the returned jobs newest first)
- `date_posted` (string, default: all) — values: all, today, 3days, week, month. Monster filters on its own refresh date, so a returned `job_posted_at` can be older than the window.
- `employment_types` (string) — comma-separated, OR-ed: FULLTIME, PARTTIME, CONTRACTOR, INTERN
- `remote_jobs_only` (boolean, default: false) — only remote jobs
- `radius` (integer) — range: 1-160, kilometres around `location`. Requires `location`.
- `fields` (string) — comma-separated projection over the job object (`job_id` and `job_title` always included). Example: `job_title,employer_name,job_apply_link`

**Pagination:** page_number (param: `page`, max 51) with `num_pages` (max 20) pages per call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher (always `Monster`), job_employment_type, job_employment_types, job_apply_link, job_apply_is_direct, apply_options (publisher, apply_link, is_direct), job_description, job_is_remote, job_posted_at, job_posted_at_timestamp, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_benefits_strings, job_google_link, job_salary, job_salary_string, job_min_salary, job_max_salary, job_salary_period, job_highlights (Qualifications, Responsibilities, Benefits), job_onet_soc, job_onet_job_zone, employer_reviews, job_uid, job_seo_id, job_canonical_url, job_apply_type, job_skills, job_industry, job_occupational_category, job_location_type, job_status, job_valid_through, job_provider (the feed that delivered the posting), employer_description, employer_founding_date, employer_size, employer_address, job_posted_at_date, job_salary_currency, job_publisher_recency_label, job_position
**Also in `parameters`:** the echoed request (query, page, num_pages, location, country, language, sort_by, date_posted, employment_types, remote_jobs_only, radius, fields)

---

### GET /job-details
Job Details

Full detail for up to 20 Monster jobs in one call. A search row already is the detail object, so use this to re-resolve ids stored earlier. Accepts the `job_id` from `/search`, Monster's `job_uid`, a full `job_seo_id`, or a monster.com job URL. Unknown or removed postings are omitted from the array.

**Billing:** one request per requested id, including ids that do not resolve.

**Required:**
- `job_id` (string) — comma-separated, up to 20. Example: `bW9uc3RlcjplNzc2MTJmNS1iYjNiLTQ2NWUtYTk2NS00MzlhZjk0MDk0YmQ`

**Optional:**
- `country` (string, default: us) — 2-letter code; Monster locale for the lookup and fallback for `job_country`
- `fields` (string) — comma-separated projection over the job object (`job_id` and `job_title` always included)

**Pagination:** none
**Response path:** `data` (array of jobs)
**Key fields:** same job object as `/search`

---

### GET /company-jobs
Company Jobs

Every open Monster job at one or more employers, with the same job object and filters as `/search`. Employers are matched on the display name returned as `employer_name` (substring match, so pass the full name for an exact match; a slug, URL or misspelling returns nothing). Several employers are OR-ed and ranked together, so a small employer can be missing from page 1. `query` is optional here. `sort_by`, `remote_jobs_only` and `language` are ignored on this endpoint. An employer with no open jobs and an unrecognised name both return an empty array.

**Billing:** same as `/search` (one request per page of 10, plus one for any call with `page` above 1).

**Required:**
- `company` (string) — comma-separated list of up to 10 employer display names, as in `employer_name`. A name containing a comma (`Acme, Inc.`) stays one employer. Example: `Genentech`

**Optional:**
- `query` (string) — keyword filter applied within the selected employers
- `location` (string) — free-text location. Omit to browse the employer country-wide. Required by `radius`.
- `page` (integer, default: 1) — range: 1-51, 10 jobs per page
- `num_pages` (integer, default: 1) — range: 1-20
- `country` (string, default: us) — same coverage as `/search`
- `date_posted` (string, default: all) — values: all, today, 3days, week, month
- `employment_types` (string) — comma-separated, OR-ed: FULLTIME, PARTTIME, CONTRACTOR, INTERN
- `radius` (integer) — range: 1-160, kilometres around `location`. Requires `location`.
- `fields` (string) — comma-separated projection over the job object

**Pagination:** page_number (param: `page`, max 51) with `num_pages` (max 20) pages per call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** same job object as `/search`
**Also in `parameters`:** company, query, page, num_pages, location, country, date_posted, employment_types, radius, fields

---
