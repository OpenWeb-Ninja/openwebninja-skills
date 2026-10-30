# realtime-linkedin-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_linkedin_data.yaml

**Host:** `real-time-linkedin-data3.p.rapidapi.com`

Fast and reliable LinkedIn job search, company job listings, full job details, and company details in real-time - titles, employers, locations, exact posting dates, salaries, seniority, company profiles, and more.

## Endpoints

### GET /search
Search Jobs

10 jobs per page, with no posting repeated across pages, so `num_pages=N` returns `N x 10` jobs until the result set runs out. At most 1000 jobs are retrievable per query: `page` is capped at 100 and `page` + `num_pages` - 1 may not pass page 100. A call returning fewer than `num_pages x 10` jobs is the last one. `include_details` (default `true`) fills the fields a search card cannot carry, for up to 100 jobs per call.

**Billing:** one request per upstream page of 10 actually fetched. `employment_types`, `seniority_levels` and `remote_jobs_only` over-fetch up to 3x the requested pages (capped at 10) to refill the page after filtering, and those extra pages are billed.

**Required:**
- `query` (string) — free-form job search query (one per request). Example: `software engineer`

**Optional:**
- `location` (string) — free-text location, works internationally, e.g. `London, United Kingdom`. `radius` does not apply to it.
- `page` (integer, default: 1) — range: 1-100, 10 jobs per page
- `num_pages` (integer, default: 1) — range: 1-20, consecutive pages fetched and concatenated starting at `page` (above 20 is a 400)
- `geo_id` (string) — LinkedIn numeric geo id, e.g. `102571732` (New York City), `103644278` (United States). Take it from a `geoId=` parameter on a linkedin.com/jobs URL. Required by `radius`.
- `country` (string, default: us) — 2-letter code; fallback for `job_country` when the posting's location names no country. Geography is driven by `location` / `geo_id`.
- `sort_by` (string, default: relevance) — values: relevance, date (date sorts the jobs in this response newest first; it does not re-rank upstream)
- `date_posted` (string, default: all) — values: all, today, 3days, week, month (exact 24 h / 72 h / 7 d / 30 d windows, applied by LinkedIn)
- `employment_types` (string) — comma-separated: FULLTIME, PARTTIME, CONTRACTOR, INTERN. Filtered locally: forces `include_details` on, returns fewer than `num_pages x 10` jobs, bills the extra pages.
- `seniority_levels` (string) — comma-separated LinkedIn levels: Internship, Entry level, Associate, Mid-Senior level, Director, Executive, Not Applicable. Filtered locally, same cost as `employment_types`.
- `company_id` (string) — restrict to one LinkedIn company by numeric id (returned on every job as `job_linkedin_company_id`)
- `remote_jobs_only` (boolean, default: false) — only jobs with an explicit remote marker in location or title. Low recall: most queries return few or no jobs with it set.
- `include_details` (boolean, default: true) — fetch each job's detail page (description, employment type, salary, seniority, function, industries, applicant count, company id). `false` gives a card-only response roughly 3x faster.
- `radius` (integer) — min 1, kilometres. Requires `geo_id` (a 400 without it).
- `fields` (string) — comma-separated projection over the job object (`job_id` and `job_title` always included; an unknown field is a 400). Example: `job_title,employer_name,job_apply_link`

**Pagination:** page_number (param: `page`, max 100) with `num_pages` (max 20) pages per call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher (always `LinkedIn`), job_employment_type, job_employment_types, job_apply_link (the LinkedIn posting URL), job_apply_is_direct (always false), apply_options (apply_link, is_direct, publisher), job_description, job_is_remote (true or null), job_posted_at, job_posted_at_timestamp, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_benefits_strings, job_google_link, job_salary, job_salary_string, job_min_salary, job_max_salary, job_salary_period, job_highlights, job_onet_soc, job_onet_job_zone, employer_reviews, job_uid, employer_linkedin_url, job_linkedin_company_id, job_seniority_level, job_function, job_industries, job_applicants_count, job_applicants_label, job_salary_currency, job_posted_at_date, job_posted_at_linkedin_label, job_linkedin_badges, job_position
**Also in `parameters`:** the echoed request (query, page, num_pages, location, geo_id, radius, date_posted, company_id, employment_types, seniority_levels, remote_jobs_only, sort_by, include_details, fields)

---

### GET /job-details
Job Details

Full details for up to 20 LinkedIn jobs in one call, with the same job object as `/search`. `job_position` and `job_posted_at_date` are always null here, and the posting date is derived from LinkedIn's relative label, so `/search` is the authoritative source for the exact date. An unknown or removed job id is omitted from the array, never an error.

**Required:**
- `job_id` (string) — comma-separated, up to 20 `job_id` values from `/search` (the numeric `job_uid` is also accepted). Example: `bGlua2VkaW46NDQ1MzY3MDk3Mw`

**Optional:**
- `fields` (string) — comma-separated projection over the job object (`job_id` and `job_title` always included)

**Pagination:** none
**Response path:** `data` (array of jobs)
**Key fields:** same job object as `/search`

---

### GET /company-jobs
Company Jobs

Every open LinkedIn job at one or more companies, with the same job object, filters, pagination and billing as `/search`. Identify the company by `company_id` (numeric, returned on every job as `job_linkedin_company_id`) or `company` (vanity slug or company page URL, resolved live). Several companies are OR-ed and ranked together, so a small company paired with a large one can be missing from page 1. `query` is optional here: omit it to get the company's whole job list. A company with no open jobs, or a numeric id that does not exist, returns an empty array; an unknown slug in `company` is a 404.

**Billing:** same as `/search`, plus one request per `company` slug resolved.

**Required:**
- One of `company_id` or `company` is required.
- `company_id` (string) — comma-separated LinkedIn company ids, up to 10, OR-ed
- `company` (string) — comma-separated vanity slugs or company page URLs, up to 10 (`microsoft`, `/company/microsoft` and a full URL all work). Each slug costs one extra billed request. Example: `microsoft`

**Optional:**
- `query` (string) — keyword filter applied within the selected companies
- `location` (string) — free-text location
- `geo_id` (string) — LinkedIn numeric geo id. Required by `radius`.
- `radius` (integer) — min 1, kilometres. Requires `geo_id`.
- `date_posted` (string, default: all) — values: all, today, 3days, week, month
- `employment_types` (string) — comma-separated: FULLTIME, PARTTIME, CONTRACTOR, INTERN (filtered locally, as on `/search`)
- `seniority_levels` (string) — comma-separated: Internship, Entry level, Associate, Mid-Senior level, Director, Executive, Not Applicable (filtered locally)
- `remote_jobs_only` (boolean, default: false) — best-effort, low recall
- `sort_by` (string, default: relevance) — values: relevance, date
- `page` (integer, default: 1) — range: 1-100, 10 jobs per page
- `num_pages` (integer, default: 1) — range: 1-20
- `include_details` (boolean, default: true) — as on `/search`
- `fields` (string) — comma-separated projection over the job object

**Pagination:** page_number (param: `page`, max 100) with `num_pages` (max 20) pages per call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** same job object as `/search`
**Also in `parameters`:** company, company_ids_resolved (the union of ids actually searched), plus the echoed `/search` parameters

---

### GET /company-details
Company Details

Public LinkedIn company page data for one company. Identify it by `company` (vanity slug or company page URL). Every field is always present, `null` (or `[]`) when the company has not filled it in on LinkedIn. The response carries `company_id`, the numeric id `/company-jobs` takes. An unknown slug is a 404; school (university) pages are login-walled on LinkedIn and return a 400.

**Billing:** one request per call.

**Required:**
- `company` (string) — LinkedIn company vanity slug or company page URL (`stripe`, `https://www.linkedin.com/company/stripe/`). Example: `stripe`

**Response path:** `data` (one company object)
**Key fields:** company_id, company_slug, company_name, company_linkedin_url, company_description, company_slogan, company_website, company_industry, company_type, company_size, company_employees_on_linkedin, company_followers, company_founded_year, company_headquarters, company_address_street, company_address_city, company_address_region, company_address_postal_code, company_address_country, company_specialties, company_logo, company_cover_image, company_locations (address, is_primary), company_affiliated_pages and company_similar_pages (name, slug, linkedin_url, industry, location, logo)
**Also in `parameters`:** company

---
