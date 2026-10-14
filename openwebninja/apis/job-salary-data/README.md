# job-salary-data

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/job_salary_data.yaml

**Host:** `job-salary-data.p.rapidapi.com`
**Notes:** No pagination — each call returns salary estimates for a given job title and location. Use `location_type` to control geographic scope (city, state, country, or any).

## Endpoints

### GET /job-salary
Job Salary — Get estimated job salaries/pay by job title and location.

**Required:**
- `job_title` (string) Example: `nodejs developer`
- `location` (string) — Free-text location/area Example: `New York`

**Optional:**
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY Example: `CITY`
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN Example: `FOUR_TO_SIX`

**Pagination:** none
**Response path:** `data`
**Key fields:** job_title, location, min_salary, max_salary, median_salary, salary_period, salary_currency, confidence, publisher_name, publisher_link

---

### GET /company-job-salary
Company Job Salary — Get estimated job salaries/pay in a specific company by job title and optionally a location and experience level in years, broken down by base salary and additional pay (bonuses, etc.).

**Required:**
- `company` (string) — Company name Example: `Amazon`
- `job_title` (string) Example: `software developer`

**Optional:**
- `location` (string) Example: `San Francisco, CA`
- `location_type` (string, default: ANY) — values: ANY, CITY, STATE, COUNTRY Example: `CITY`
- `years_of_experience` (string, default: ALL) — values: ALL, LESS_THAN_ONE, ONE_TO_THREE, FOUR_TO_SIX, SEVEN_TO_NINE, TEN_TO_FOURTEEN, ABOVE_FIFTEEN Example: `SEVEN_TO_NINE`

**Pagination:** none
**Response path:** `data`
**Key fields:** job_title, company, location, min_salary, max_salary, median_salary, min_base_salary, max_base_salary, median_base_salary, min_additional_pay, max_additional_pay, median_additional_pay, salary_count, salary_period, salary_currency, confidence
