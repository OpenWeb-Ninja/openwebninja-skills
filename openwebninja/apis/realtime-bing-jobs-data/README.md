# realtime-bing-jobs-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_bing_jobs_data.yaml

**Host:** `real-time-bing-jobs-data.p.rapidapi.com`

Fast and Reliable Job Searches on Public Job Sites: LinkedIn, ZipRecruiter, Monster, and Others in Real-Time from Microsoft Bing Jobs Search.

## Endpoints

### GET /search
Search Jobs

Bing's jobs vertical is keyed off natural language, so put the role and the location in `query` (`developer jobs in new york`); a bare keyword drifts toward unrelated postings. With `include_descriptions=true` (default) each job's description, apply links and logo are filled from its detail page, capped at 100 jobs per request. Results are de-duplicated by `job_id` within a request; Bing's ranking drifts slightly, so two separate page requests can share a few ids. Every request walks Bing's results from the start, so deeper pages are slower. There is no `has_more` flag: a call returning fewer than `num_pages` x 10 jobs has reached the end, unless `exclude_job_publishers` removed some. Salary fields are always empty on `/search` (use `/job-details`). An empty `data` array means Bing had no matches; a failure to reach Bing is a 503 and is not billed.

**Billing:** one request per page of 10 jobs returned (at least one). The detail fetches behind `include_descriptions` are not billed.

**Required:**
- `query` (string) — free-form query including job title and location. Example: `developer jobs in new york`

**Optional:**
- `location` (string) — free-text location, appended to the query text. Example: `New York, NY`
- `page` (integer, default: 1) — range: 1-50, 10 jobs per page. `page` + `num_pages` - 1 must stay within page 50.
- `num_pages` (integer, default: 1) — range: 1-20, pages returned starting at `page`, merged and de-duplicated
- `country` (string, default: us) — ISO 3166-1 alpha-2; selects Bing's national job index (for jobs in Berlin, send `de`)
- `language` (string) — ISO 639-1 interface language. Defaults to the primary language of `country`. With `en`, the word *jobs* is appended to a query that does not contain *job*.
- `date_posted` (string, default: all) — values: all, today, 3days, week, month. `month` has no Bing equivalent (Bing's widest window is 7 days), so it is sent unfiltered and returns a superset.
- `employment_types` (string) — comma-separated: FULLTIME, CONTRACTOR, PARTTIME, INTERN (INTERN is enforced on the type Bing states)
- `work_from_home` (boolean, default: false) — only remote jobs
- `radius` (number) — range: 0-10000, km from the location in `query`/`location`. Snapped to Bing's 10/20/30/40 mile menu (32 km becomes 20 miles).
- `exclude_job_publishers` (string) — comma-separated publishers to drop, case-insensitive substring match against `job_publisher` and `job_publishers`. Example: `LinkedIn,Indeed`
- `include_descriptions` (boolean, default: true) — fetch full description and apply links; `false` for a faster listing-only response
- `fields` (string) — comma-separated projection over the job object (`job_id` and `job_title` always included). Example: `job_title,employer_name,job_apply_link`

**Pagination:** page_number (param: `page`, max 50) with `num_pages` (max 20) pages per call
**Page size:** fixed 10 per page
**Response path:** `data` (flat array of jobs)
**Key fields:** job_id, job_title, employer_name, employer_logo, employer_website, job_publisher, job_publishers, job_employment_type (Bing's label, e.g. Full-time), job_employment_types (normalized), job_apply_link, job_apply_is_direct, apply_options (apply_link, is_direct, publisher), job_description, job_is_remote, job_posted_at, job_posted_at_bing_label, job_posted_at_timestamp, job_posted_at_datetime_utc, job_offer_expiration_timestamp, job_offer_expiration_datetime_utc, job_location, job_city, job_state, job_country, job_latitude, job_longitude, job_benefits, job_benefits_strings, job_google_link, job_salary, job_salary_string, job_min_salary, job_max_salary, job_salary_period, job_highlights, job_onet_soc, job_onet_job_zone, employer_reviews, job_uid, job_bing_company_id, job_bing_title_id, job_normalized_title, job_position. Always `null`: employer_website, job_latitude, job_longitude, job_benefits, job_google_link, job_salary, job_salary_string, job_onet_soc, job_onet_job_zone, employer_reviews.
**Also in `parameters`:** the echoed request (query, page, num_pages, date_posted, work_from_home, employment_types, radius, exclude_job_publishers, include_descriptions, country, language, location, fields)

---

### GET /job-details
Job Details

Full details for up to 20 Bing jobs in one call, with the complete description and the decoded apply links of every board carrying the posting. Each job is enriched with AI-extracted fields (below), and `job_min_salary`, `job_max_salary`, `job_salary_period`, `job_city` and `job_state` are filled from the description where Bing left them empty. Enrichment is best-effort and cached for 7 days per job. Ids that do not resolve are omitted from the array. `job_bing_company_id`, `job_bing_title_id` and `job_position` are search-only.

**Billing:** one request per requested id, including ids that do not resolve.

**Required:**
- `job_id` (string) — comma-separated, up to 20 `job_id` values from `/search` (the raw `job_uid` is also accepted). Example: `YmluZzotNDYyNDU5MzAzLlJldHJv`

**Optional:**
- `country` (string, default: us) — country the job was searched in; fallback for `job_country`
- `language` (string) — ISO 639-1. Defaults to the primary language of `country`.
- `fields` (string) — comma-separated projection over the job object. Search-only keys are accepted and ignored, so one field list works on both endpoints.

**Pagination:** none
**Response path:** `data` (array of jobs)
**Key fields:** same job object as `/search`, plus the AI-extracted work_arrangement (onsite, remote, hybrid), seniority_level (entry, mid, senior, principal, lead, manager), required_experience_years, education_required (level, field), visa_sponsorship, relocation_required, relocation_assistance, contract_duration, start_date, required_technologies, preferred_technologies, methodologies, industry, job_function (backend, frontend, full-stack, mobile, devops, data-engineering, ml-ai, systems, qa, security, other), has_management_responsibilities, ai_ml_involved, benefits_extended, soft_skills

---
