# realtime-ziprecruiter-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_ziprecruiter_data.yaml

**Host:** `real-time-ziprecruiter-data.p.rapidapi.com`

Fast and Reliable Job Search, Full Job Details, Salary Estimates, Job Descriptions, Salaries, Benefits, Employer Ratings, Pay Distributions, and More on ZipRecruiter in Real-Time (US and Canada).

Coverage is the United States and Canada only: `country` accepts `us` and `ca`, anything else is a 400.

## Endpoints

### GET /search
Search Jobs

Returns a flat array of job objects (the same envelope as JSearch `/search`). **`include_details` defaults to `false`:** a search card carries only a short teaser (`ziprecruiter_short_description`), so `job_description`, `job_highlights`, `employer_website`, `employer_reviews`, `job_onet_soc` and the detail-only `ziprecruiter_*` company fields come back null. Set `include_details=true` to fill them (one extra billed request per job; caps `num_pages` at 5). 20 jobs per page with cross-page duplicates removed; a call returning fewer than `num_pages` x 20 jobs is the end of the result set (largest set observed: 946 jobs). Results are always in ZipRecruiter's relevance order: `sort_by`, `sort`, `order` and a `company` name are a 400. Billed one request per requested page, plus one per job with `include_details=true`.

**Required:**
- `query` (string) — exactly one query per request. Example: `software engineer`

**Optional:**
- `location` (string) — free-text location; drives geography. Omit to search the whole country. Example: `New York, NY`
- `page` (integer, default: 1) — range: 1-50, 20 jobs per page (the real ceiling is ceil(total matches / 20))
- `num_pages` (integer, default: 1) — range: 1-20 (max 5 with `include_details=true`). Consecutive pages to fetch starting at `page`.
- `country` (string, default: us) — values: us, ca
- `date_posted` (string, default: all) — values: all, today, 3days, week, month (1, 3, 7 and 30 days, applied by ZipRecruiter)
- `employment_types` (string) — comma-separated, OR-ed: FULLTIME, PARTTIME, CONTRACTOR, TEMPORARY, CONTRACT_TO_HIRE, AS_NEEDED, OTHER. Example: `FULLTIME,CONTRACTOR`
- `experience_level` (string) — one value: no_experience, junior, mid, senior (a comma-separated list is a 400)
- `remote_jobs_only` (boolean, default: false) — only remote jobs, by ZipRecruiter's own remote classification
- `salary_min` (integer) — minimum ANNUAL salary in whole dollars; limits results to jobs that state a salary. Example: `80000`
- `salary_max` (integer) — maximum ANNUAL salary in whole dollars, must be >= `salary_min`. Example: `150000`
- `radius` (integer) — km around `location` (ZipRecruiter's default is 25 miles). Requires `location` (400 without it).
- `zipapply_only` (boolean, default: false) — only jobs that support ZipApply (one-click apply)
- `company_id` (string) — only jobs from one company: the `ziprecruiter_company_id` on a previous result. Send `location` too (the filter holds far more reliably with one). Every card is verified; an unknown id, or the placeholder `zr_missing_company_default`, is a 404. `total_results` is not available for a company-scoped search, so page until a call comes back short.
- `include_details` (boolean, default: false) — fetch each job's full description and detail-only fields (one extra billed request per job, caps `num_pages` at 5)
- `fields` (string) — comma-separated projection over the job object; `job_id` and `job_title` are always included, an unknown field is a 400. Example: `job_title,employer_name,job_apply_link`

**Pagination:** page_number (param: `page`, max 50); `num_pages` (1-20, 1-5 with details) concatenates consecutive pages in one call
**Page size:** fixed 20 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher, job_employment_type, job_employment_types, job_apply_link, job_apply_is_direct, apply_options (publisher, apply_link, is_direct), job_description, job_is_remote, job_posted_at, job_posted_at_timestamp, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_benefits_strings, job_google_link, job_salary, job_salary_string, job_min_salary, job_max_salary, job_salary_period, job_highlights, job_onet_soc, job_onet_job_zone, employer_reviews (publisher, employer_name, score, num_stars, review_count, max_score, reviews_link), job_uid
**ZipRecruiter-only fields:** ziprecruiter_listing_key, ziprecruiter_short_description, ziprecruiter_description_html, ziprecruiter_share_url, ziprecruiter_canonical_job_url, ziprecruiter_updated_at, ziprecruiter_is_new, ziprecruiter_apply_type (OPEN_APPLY_FLOW, OPEN_EXTERNAL), ziprecruiter_apply_host, ziprecruiter_salary_source (SOURCE_PROVIDED, SOURCE_PARSED, SOURCE_PREDICTED, SOURCE_MISSING), ziprecruiter_salary_is_estimated, ziprecruiter_location_type, ziprecruiter_location_county, ziprecruiter_location_postal_code, ziprecruiter_location_id, ziprecruiter_company_id, ziprecruiter_company_slug, ziprecruiter_company_size, ziprecruiter_company_hq, ziprecruiter_company_industries, ziprecruiter_job_industry, ziprecruiter_valid_through, ziprecruiter_ats_identifier, ziprecruiter_key_responsibilities, ziprecruiter_employer_faq (question, answer)
**Notes:** salary fields are filled only when ZipRecruiter itself displays a salary (provenance in `ziprecruiter_salary_source` / `ziprecruiter_salary_is_estimated`). `job_apply_link` is the canonical ZipRecruiter posting URL and `job_apply_is_direct` is always false; read `ziprecruiter_apply_type` for the apply flow.

---

### GET /job-details
Job Details

Full details for up to 20 ZipRecruiter job postings in one call. Always reads the detail page, so `job_description`, `job_highlights`, `employer_website` and the company fields are filled without any flag. An id this API did not mint, or a posting that was taken down, is omitted from the array while the rest of the batch resolves. Billed one request per requested id.

**Required:**
- `job_id` (string) — comma-separated job ids from a `/search` response, up to 20 per request; the raw `job_uid` is also accepted. Example: `emlwcmVjcnVpdGVyOjkzNjIxNWNiNTAzZDhiZTI`

**Optional:**
- `country` (string, default: us) — values: us, ca
- `fields` (string) — comma-separated projection, as on `/search`

**Pagination:** none (up to 20 ids per call)
**Response path:** `data` (array, one job object per resolved id)
**Key fields:** Same job object as `/search`; the card-only fields `ziprecruiter_short_description`, `ziprecruiter_updated_at` and `ziprecruiter_is_new` are null here.

---

### GET /estimated-salary
Estimated Salary

The pay distribution ZipRecruiter publishes for a job title, nationally or in one US state or Canadian province: one row, always annual (`salary_period` is `YEAR`). `median_salary` is the real median parsed from the page's data layer (ZipRecruiter's own JSON-LD "median" is actually the mean and travels alongside as `ziprecruiter_json_ld_median`). City-level figures do not exist: a city or a 2-letter code is a 400, and `location_type` / `years_of_experience` (JSearch params) are a 400 here. A title with no published page, or no figures for the requested state, is a 404. Billed 1 request per call.

**Required:**
- `job_title` (string) — job title to price, matched against ZipRecruiter's salary pages. Example: `Registered Nurse`

**Optional:**
- `location` (string, default: nationwide) — US state, Canadian province or country, spelled out in full. Example: `New York`, `Alberta`
- `country` (string, default: us) — values: us, ca
- `fields` (string) — comma-separated projection over the salary row; `job_title` and `location` are always included. Example: `median_salary,salary_period`

**Pagination:** none
**Response path:** `data` (array with one salary row)
**Key fields:** location, job_title, min_salary, max_salary, median_salary, min_base_salary, max_base_salary, median_base_salary, min_additional_pay, max_additional_pay, median_additional_pay, salary_period, salary_currency, salary_count, salaries_updated_at, publisher_name, publisher_link, confidence
**ZipRecruiter-only fields:** ziprecruiter_average_salary, ziprecruiter_national_average_salary, ziprecruiter_p25_salary, ziprecruiter_p75_salary, ziprecruiter_pay_frequencies (year, month, week, hour: salary_period, average_salary, national_average_salary, median_salary, p10_salary, p25_salary, p75_salary, p90_salary, average_salary_delta), ziprecruiter_salary_histogram (bucket_count, bucket_min_list, bucket_probability_list, buckets: min_salary, max_salary, probability), ziprecruiter_salaries_by_state (state, annual_salary, monthly_pay, weekly_pay, hourly_wage, difference_from_average, difference_percent), ziprecruiter_top_paying_cities (city, state, annual_salary, monthly_pay, weekly_pay, hourly_wage, difference_from_average, difference_percent), ziprecruiter_related_titles (job_title, annual_salary, monthly_pay, weekly_pay, hourly_wage, difference_from_average, difference_percent), ziprecruiter_total_listings, ziprecruiter_spread_level, ziprecruiter_location_granularity (NATIONAL, STATE), ziprecruiter_preferred_pay_period, ziprecruiter_job_title_searched, ziprecruiter_salaries_updated_at_text, ziprecruiter_summary, ziprecruiter_faq (question, answer), ziprecruiter_json_ld_median

---
