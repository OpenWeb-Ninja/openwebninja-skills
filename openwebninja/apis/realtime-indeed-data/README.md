# realtime-indeed-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_indeed_data.yaml

**Host:** `real-time-indeed-data.p.rapidapi.com`

Fast and Reliable Job Searches, including Full Job Details, Employer Reviews, Job Descriptions, Direct Apply Links, Salaries, Rating, and More, from Indeed in Real-Time (unofficial API).

## Endpoints

### GET /search
Search Jobs

Returns a flat array of job objects (the same envelope as JSearch `/search`), with the full `job_description` already filled. 10 jobs per page, repeated postings removed. A broad query can retrieve roughly 850 to 965 unique jobs before Indeed's results run out and the response comes back short; a narrow query runs out sooner. `page` and `num_pages` together reach at most job 990.

**Required:**
- `query` (string) — exactly one query per request (a multi-valued `query` is a 400). Example: `software engineer`

**Optional:**
- `location` (string) — where to search, in Indeed's own format; omit to search the whole market. Example: `New York, NY`
- `page` (integer, default: 1) — range: 1-50 (values above 50 are clamped), 10 jobs per page
- `num_pages` (integer, default: 1) — range: 1-50. Pages returned in one response, billed only for pages returned. Beyond roughly 450 jobs the response is trimmed to fit the 6 MB limit and `parameters.response_truncated` is set; pass `fields` to keep a deep window intact.
- `country` (string, default: us) — ISO 3166-1 alpha-2 market code; any Indeed market works (e.g. us, gb, de, ca, in, au)
- `language` (string) — ISO 639-1 language; defaults to the primary language of `country`
- `date_posted` (string, default: all) — values: all, today, 3days, week, month. Combined with any other filter the date window is applied locally and can return fewer jobs than qualify; filter by date alone when you need every matching job.
- `employment_types` (string) — comma-separated, a job matches if it carries any of them: FULLTIME, CONTRACTOR, PARTTIME, INTERN (Temporary and Seasonal show up in `job_indeed_attributes`)
- `experience_level` (string) — comma-separated, a job matches if it carries any of them: ENTRY_LEVEL, MID_LEVEL, SENIOR_LEVEL, NO_EXPERIENCE
- `work_from_home` (boolean) — `true` returns only jobs Indeed tags as Remote; hybrid roles are excluded (see `job_indeed_is_hybrid`)
- `min_salary` (number) — minimum ANNUAL salary, applied to the salary the employer stated (annualised from `job_salary_period`); jobs with no stated salary are excluded
- `max_salary` (number) — maximum ANNUAL salary, same semantics as `min_salary`
- `radius` (number) — range: 0-10000 (km around `location`, values above 10000 are clamped). Requires `location` (400 without it).
- `exclude_job_publishers` (string) — comma-separated publishers to drop, matched case-insensitively against `job_publisher`. Example: `BeeBe,Dice`
- `fields` (string) — comma-separated projection over the job object; `job_id` and `job_title` are always included, an unknown field is a 400. Example: `job_title,employer_name,job_apply_link`

**Pagination:** page_number (param: `page`, max 50); `num_pages` (1-50) concatenates consecutive pages in one call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher, job_employment_type, job_employment_types, job_apply_link, job_apply_is_direct, apply_options (publisher, apply_link, is_direct), job_description, job_is_remote, job_posted_at, job_posted_at_timestamp, job_posted_at_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_benefits_strings, job_google_link, job_salary, job_salary_string, job_min_salary, job_max_salary, job_salary_period, job_highlights, job_onet_soc, job_onet_job_zone, employer_reviews, job_uid
**Indeed-only fields:** job_indeed_ref_num, job_indeed_normalized_title, job_indeed_source_employer_name, job_indeed_employer_key, job_indeed_company_page_url, job_indeed_employer_header_image, job_indeed_employer_industry, job_indeed_occupations (key, label), job_indeed_attributes (key, label), job_indeed_experience_levels, job_indeed_is_hybrid, job_indeed_is_urgent_hire, job_indeed_is_high_volume_hiring, job_indeed_expired, job_indeed_language, job_indeed_postal_code, job_indeed_street_address, job_published_at_timestamp, job_published_at_datetime_utc, job_description_html, job_position
**Also in `parameters`:** response_truncated (always present), jobs_returned and jobs_omitted (only when truncated; omitted jobs are not billed), plus the echoed request params

---

### GET /job-details
Job Details

Full details for up to 20 jobs in a single request. The whole batch resolves in one upstream call, so a multi-id request costs the same as a single-id one. An invalid or expired id is omitted from the array while the rest of the batch resolves normally.

**Required:**
- `job_id` (string) — comma-separated list of up to 20 `job_id` values from a `/search` response; the raw 16-hex `job_uid` is also accepted. Example: `aW5kZWVkOjQ3NmU1ODZjZjJiOTFjNDY`

**Optional:**
- `country` (string, default: us) — ISO 3166-1 alpha-2 market code
- `language` (string) — ISO 639-1 language; defaults to the primary language of `country`
- `fields` (string) — comma-separated projection, as on `/search`

**Pagination:** none (up to 20 ids per call)
**Response path:** `data` (array, one job object per resolved id)
**Key fields:** Same job object as `/search` (including every Indeed-only field); `job_position` is null here.

---

### GET /company-reviews
Company Reviews

Employee reviews for one company, with its overall rating, the five category ratings and the 1-5 star distribution. Pass a job's `job_indeed_company_page_url` straight through as `company` to go from a job to its employer's reviews in one hop. `company_review_count` is every review the company has; `company_filtered_review_count` is how many the current filters can page through (Indeed's default view is US only; `country=ALL` makes the two equal). A page past the last returns an empty `reviews` array with `parameters.page_past_last: true`. Billed one request per page of 20 reviews, plus one more when `company` is a free-text name.

**Required:**
- `company` (string) — an Indeed `/cmp` slug, a full or relative `/cmp` URL, or a free-text name. Slugs and URLs are free; a free-text name is resolved through Indeed's company search (one extra billed request). An unknown slug is a 404. Example: `Lutron-Electronics`

**Optional:**
- `page` (integer, default: 1) — range: 1-100 (values above 100 are clamped), 20 reviews per page
- `num_pages` (integer, default: 1) — range: 1-10 (values above 10 are clamped). Consecutive pages to fetch and concatenate, starting at `page`.
- `sort` (string, default: relevance) — values: relevance (Indeed's order, already newest-first), helpfulness, rating_desc, rating_asc
- `country` (string) — which country's reviews to return, as a 2-letter code, or `ALL` for every country. Example: `ALL`
- `location` (string) — narrow to one location within `country`, in Indeed's format. Requires a 2-letter `country` (400 without it). Example: `Coopersburg, PA`
- `topic` (string) — values: wlbalance, paybenefits, jobsecadv, mgmt, culture (ids and per-topic counts come back in `company_review_topics`)
- `job_title` (string) — only reviews written by people with this job title. Example: `Engineer`
- `text` (string) — full-text search within the company's reviews. Example: `pay`

**Pagination:** page_number (param: `page`, max 100); `num_pages` (1-10) concatenates consecutive pages in one call
**Page size:** fixed 20 per page
**Response path:** `data` (object; reviews in `data.reviews[]`)
**Company fields:** company_name, company_id, company_slug, company_url, company_reviews_url, company_logo, company_header_image, company_rating, company_review_count, company_filtered_review_count, company_happiness_score, company_happiness_grade, company_category_ratings (work_life_balance, compensation_benefits, job_security_advancement, management, culture), company_rating_distribution (1-5 star counts), company_review_topics (topic_id, topic_name, review_count, rating), company_pros, company_cons, reviews
**Review fields:** review_id, review_uid, review_title, review_text, review_rating, review_category_ratings, review_job_title, review_job_title_normalized, review_location, review_country, review_is_current_employee, review_posted_at, review_posted_at_date, review_posted_at_timestamp, review_posted_at_datetime_utc, review_helpful_count, review_unhelpful_count, review_url, review_share_url, review_status, review_is_redacted, review_comment_count
**Also in `parameters`:** company_slug_resolved (the `/cmp` slug actually used), company_matches (top 5 candidates, only when `company` was a free-text name), page_past_last

---
