# realtime-glassdoor-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_glassdoor_data.yaml

**Host:** `real-time-glassdoor-data.p.rapidapi.com`
**Notes:** Page-based pagination on /company-reviews (data.reviews), /company-jobs, /company-salaries-v2 (data.salaries) and /company-interviews (data.interviews, page_size up to 100). /job-search is cursor-based (data.cursor). /company-search returns up to limit (max 100) in one call.

## Endpoints

### GET /company-search
Company Search — Search for companies (employers) on Glassdoor.

**Required:**
- `query` (string) — Search query or Company ID Example: `goo`

**Optional:**
- `limit` (number, default: 10) — values: 1-100 Example: `10`
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** none
**Page size param:** `limit` (default: 10)
**Response path:** `data`
**Key fields:** company_id, name, company_link, rating, review_count, salary_count, job_count, headquarters_location, company_size, industry, website, revenue, ceo

---

### GET /company-overview
Company Overview — Get company (employer) overview/details from Glassdoor (e.g. https://www.glassdoor.com/Overview/Working-at-Apple-EI_IE1138.11,16.htm).

**Required:**
- `company_id` (string) — Glassdoor company ID Example: `1138`

**Optional:**
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** none

---

### GET /company-reviews
Company Reviews — Get company (employer) reviews from Glassdoor, with filters, sort option, and pagination support.

**Required:**
- `company_id` (string) Example: `9079`

**Optional:**
- `page` (integer, default: 1) Example: `1`
- `sort` (string, default: POPULAR) — values: POPULAR, MOST_RECENT, HIGHEST_RATING, LOWEST_RATING
- `query` (string) — Return reviews matching a search query
- `language` (string, default: en) — values: en, fr, nl, de, pt, es, it
- `employment_statuses` (string) — values: REGULAR, INTERN, PART_TIME, CONTRACT, FREELANCE
- `only_current_employees` (string, default: false) Example: `false`
- `extended_rating_data` (boolean, default: false) Example: `false`
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** page_number (param: `page`), 10 reviews per page, `data.page_count` pages
**Response path:** `data` (reviews in `data.reviews[]`)
**Key fields:** review_id, summary, pros, cons, rating, review_link, job_title, review_datetime, employment_status, is_current_employee, location, helpful_count, work_life_balance_rating, culture_and_values_rating, compensation_and_benefits_rating, career_opportunities_rating, senior_management_rating, language

---

### GET /company-jobs
Company Jobs — Get jobs posted by a specific company with filtering support and additional options available on Glassdoor.

**Required:**
- `company_id` (string) Example: `1138`

**Optional:**
- `page` (integer, default: 1) Example: `1`
- `sort` (string, default: MOST_RELEVANT) — values: MOST_RELEVANT, MOST_RECENT
- `job_function` (string, default: ANY) — values: ANY, ADMINISTRATIVE, ARTS_AND_DESIGN, BUSINESS, CONSULTING, CUSTOMER_SERVICES_AND_SUPPORT, EDUCATION, ENGINEERING, FINANCE_AND_ACCOUNTING, HEALTHCARE, HUMAN_RESOURCES, INFORMATION_TECHNOLOGY, LEGAL, MARKETING, MEDIA_AND_COMMUNICATIONS, MILITARY_AND_PROTECTIVE_SERVICES, OPERATIONS, OTHER, PRODUCT_AND_PROJECT_MANAGEMENT, RESEARCH_AND_SCIENCE, RETAIL_AND_FOOD_SERVICES, SALES, SKILLED_LABOR_AND_MANUFACTURING, TRANSPORTATION
- `location` (string)
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `max_age_days` (number, default: 0) — values: 0-1000 Example: `0`
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** page_number (param: `page`)

---

### GET /company-salaries
Company Salaries — Get salary estimation in a specific company by job title and location (optional).

**Required:**
- `company_id` (string) — Company ID Example: `1138`
- `job_title` (string) — The job title for which to get salary estimation. Example: `software developer`

**Optional:**
- `location` (string) — The location for which to get salary estimation (e.g. SanFrancisco). Example: `San-Francisco`
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** none

---

### GET /company-salaries-v2
Company Salaries v2 — Get and Search Company Data, Jobs, Employer Reviews, Salaries, Interviews, and More from Glassdoor in Real-Time (unofficial API).

**Required:**
- `company_id` (string) — Glassdoor company ID or name (e.g. 9079 / e.g. Amazon) Example: `1138`

**Optional:**
- `location` (string) — The location for which to get salary estimation (e.g. San Francisco).
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `job_title` (string) — The job title for which to get salary estimation
- `page` (number, default: 1) — The salaries page to return (each page includes up to 10 results). Example: `1`
- `sort` (string, default: MOST_SALARIES) — values: MOST_SALARIES, HIGH_TO_LOW, MOST_RECENT
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** page_number (param: `page`), `data.num_pages` pages
**Response path:** `data` (salaries in `data.salaries[]`)
**Key fields:** job_title, job_title_id, salary_currency, salary_count, salary_period, min_salary, median_salary, max_salary, min_base_salary, median_base_salary, max_base_salary, min_additional_pay, median_additional_pay, max_additional_pay, min_cash_bonus, median_cash_bonus, max_cash_bonus, min_stock_bonus, median_stock_bonus, max_stock_bonus

---

### GET /company-interviews
Company Interviews — Get interviews made by the company, including questions, difficulty, outcome, and more data about interviews.

**Required:**
- `company_id` (string) — Company ID Example: `1138`

**Optional:**
- `page` (integer, default: 1) Example: `1`
- `page_size` (number, default: 10) — values: 1-100 (only 5 per page when page > 1000) Example: `10`
- `sort` (string, default: POPULAR) — values: POPULAR, MOST_RECENT, OLDEST, EASIEST, MOST_DIFFICULT
- `job_function` (string, default: ANY) — values: ANY, ADMINISTRATIVE, ARTS_AND_DESIGN, BUSINESS, CONSULTING, CUSTOMER_SERVICES_AND_SUPPORT, EDUCATION, ENGINEERING, FINANCE_AND_ACCOUNTING, HEALTHCARE, HUMAN_RESOURCES, INFORMATION_TECHNOLOGY, LEGAL, MARKETING, MEDIA_AND_COMMUNICATIONS, MILITARY_AND_PROTECTIVE_SERVICES, OPERATIONS, OTHER, PRODUCT_AND_PROJECT_MANAGEMENT, RESEARCH_AND_SCIENCE, RETAIL_AND_FOOD_SERVICES, SALES, SKILLED_LABOR_AND_MANUFACTURING, TRANSPORTATION
- `job_title` (string) — Return interviews with job title matching a search query
- `location` (string) — The location for which to get interviews (e.g. SanFrancisco). Example: `San-Francisco`
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `received_offer_only` (boolean) — Only return interviews that resulted in an offer to the candidate Example: `False`
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** page_number (param: `page`)
**Page size param:** `page_size` (default: 10)
**Response path:** `data` (interviews in `data.interviews[]`)
**Key fields:** interview_id, job_title, location, interview_datetime, process_description, difficulty, outcome, duration_days, advice, questions

---

### GET /job-search
Job Search — Search for jobs with various filters and options as available on  https://www.glassdoor.com/Job/index.htm.

**Required:**
- `query` (string) Example: `front end developer`
- `location` (string) Example: `new york`

**Optional:**
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `limit` (number, default: 10) — values: 1-100 Example: `10`
- `cursor` (string) — The `data.cursor` value from the previous response
- `easy_apply_only` (boolean) — Only return jobs with easy apply. Example: `true`
- `remote_only` (string) — Only return remote jobs. Example: `true`
- `date_posted` (string, default: all) — values: all, today, 3days, week, 2weeks, month
- `min_company_rating` (string) — Minimum job employer company rating. Example: `ANY`
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** cursor (param: `cursor`, next value in `data.cursor`)
**Page size param:** `limit` (default: 10)
**Response path:** `data` (jobs in `data.jobs[]`, total in `data.total_count`)
**Key fields:** job_id, job_title, company_id, company_name, location_name, job_link, easy_apply, age_in_days, rating, salary_currency, salary_period, salary_min, salary_median, salary_max

---

### GET /salary-estimation
Salary Estimate — Get salary estimates by job title and location.

**Required:**
- `job_title` (string) — The job title for which to get salary estimation (e.g. marketing assistant). Example: `software developer`
- `location` (string) — The location for which to get salary estimation (e.g. sanfrancisco, us). Example: `new york`

**Optional:**
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN
- `domain` (string, default: www.glassdoor.com) — values: www.glassdoor.com, www.glassdoor.co.uk, www.glassdoor.com.ar, www.glassdoor.com.au, www.glassdoor.be, www.glassdoor.be, www.glassdoor.com.br, www.glassdoor.ca, www.glassdoor.ca, www.glassdoor.de, www.glassdoor.es, www.glassdoor.fr, www.glassdoor.com.hk, www.glassdoor.co.in, www.glassdoor.ie, www.glassdoor.it, www.glassdoor.com.mx, www.glassdoor.nl, www.glassdoor.co.nz, www.glassdoor.at, de.glassdoor.ch, www.glassdoor.sg, fr.glassdoor.ch

**Pagination:** none

---
