# realtime-linkedin-data Recipes

## 1. Search LinkedIn jobs in a city and export to CSV

```bash
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --query "software engineer" --location "New York, NY" --date-posted week --count 100 --format csv
```

Fetches up to 100 software engineer jobs posted in New York in the last 7 days, with description, seniority, salary (when stated) and applicant count on every row.

## 2. Fast card-only scan across a large result set

```bash
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --query "data scientist" --location "London, United Kingdom" --no-details --count 200 \
  --fields job_title,employer_name,job_location,job_posted_at_date,job_apply_link --format csv
```

Skips the per-job detail fetch (about 3x faster, 20 pages per call) to list 200 data scientist postings in London with title, employer, location, date and link.

## 3. Senior roles within a radius of a LinkedIn geo id

```bash
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --query "product manager" --geo-id 102571732 --radius 25 \
  --seniority-levels "Mid-Senior level,Director" --count 50 --format json
```

Filters to Mid-Senior and Director product manager roles within 25 km of New York City. Seniority is filtered locally, so expect fewer than the requested count and some extra billed pages.

## 4. Every open job at a company

```bash
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --endpoint /company-jobs --company microsoft --count 100 --format csv
```

Lists Microsoft's open LinkedIn postings. The slug is resolved once (one extra request); later pages reuse the resolved company id.

## 5. Look up jobs by id

```bash
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --endpoint /job-details --job-id "<job_id_1>,<job_id_2>" --dry-run
```

Fetches the full detail for up to 20 jobs per call and prints them to the console.

## 6. Chain: search jobs, then pull every job at a top employer

```bash
# Step 1: search and save
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --query "machine learning engineer" --location "San Francisco, CA" --count 30 --format json \
  --output output/linkedin_ml_jobs.json

# Step 2: take a job_linkedin_company_id from step 1 and list all that company's open jobs
node --env-file=.env apis/realtime-linkedin-data/scrape.js \
  --endpoint /company-jobs --company-id "<job_linkedin_company_id from step 1>" \
  --count 100 --format csv --output output/linkedin_company_jobs.csv
```

Finds who is hiring for a role, then pulls the full LinkedIn job list of an employer from step 1.
