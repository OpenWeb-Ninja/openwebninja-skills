# realtime-bing-jobs-data Recipes

## 1. Search jobs across job boards and export to CSV

```bash
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --query "developer jobs in new york" --count 50 --format csv
```

Fetches up to 50 jobs from Bing Jobs in one call, each with its full description, apply links and the job boards carrying it (`job_publishers`).

## 2. Remote full-time jobs posted this week, skipping some boards

```bash
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --query "product designer jobs" --work-from-home --employment-types FULLTIME \
  --date-posted week --exclude-job-publishers "LinkedIn,Indeed" --count 30 --format json
```

Finds remote full-time postings from the last 7 days that are not listed on LinkedIn or Indeed.

## 3. Fast listing-only scan in another country

```bash
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --query "data engineer jobs in berlin" --country de --include-descriptions false \
  --count 100 --fields "job_id,job_title,employer_name,job_location,job_publishers" --format csv
```

Skips the per-job detail fetch for a faster, lighter scan of Bing's German job index (up to 20 pages per call).

## 4. Full details with AI-extracted salary, seniority and skills

```bash
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --endpoint /job-details --job-id "<job_id_1>,<job_id_2>" --format json
```

Returns each job with salary range, seniority level, required technologies, education and work arrangement extracted from the description. Billed per id.

## 5. Chain: search, then enrich the results with job details

```bash
# Step 1: search and keep only ids and titles
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --query "machine learning engineer jobs in seattle" --include-descriptions false \
  --count 20 --fields "job_id,job_title,employer_name" --format json --output output/bing_ml_jobs.json

# Step 2: pass the job_id values from step 1 (comma-separated, batched 20 per call)
node --env-file=.env apis/realtime-bing-jobs-data/scrape.js \
  --endpoint /job-details --job-id "<comma-separated job_id values from step 1>" \
  --format csv --output output/bing_ml_job_details.csv
```

Builds a shortlist cheaply, then pulls salary, seniority and skills for every job on it.
