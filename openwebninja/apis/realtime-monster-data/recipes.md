# realtime-monster-data Recipes

## 1. Search Monster jobs in a city and export to CSV

```bash
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --query "registered nurse" --location "Dallas, TX" --radius 40 --count 100 --format csv
```

Fetches up to 100 nurse jobs within 40 km of Dallas in a single call (10 pages via `num_pages`), with description, salary, coordinates and apply link on every row.

## 2. Recent full-time jobs in the UK, newest first

```bash
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --query "data analyst" --country gb --date-posted week --employment-types FULLTIME \
  --sort-by date --count 50 --format json
```

Searches Monster's UK locale for full-time data analyst jobs refreshed in the last 7 days and orders the returned jobs newest first.

## 3. Every open job at one employer

```bash
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --endpoint /company-jobs --company "Genentech" --count 100 --format csv
```

Lists the employer's open Monster postings country-wide. Pass the name exactly as Monster shows it in `employer_name`; a slug or misspelling returns nothing.

## 4. Re-resolve stored job ids

```bash
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --endpoint /job-details --job-id "<job_id_1>,<job_id_2>" --dry-run
```

Looks up jobs saved from an earlier search to check they are still live. Billed per id; a search row already carries the full job, so this is not needed right after `/search`.

## 5. Chain: search jobs, then list more jobs at a top employer

```bash
# Step 1: search and save
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --query "warehouse associate" --location "Columbus, OH" --count 30 --format json \
  --output output/monster_warehouse.json

# Step 2: take an employer_name from step 1 and list all its open jobs
node --env-file=.env apis/realtime-monster-data/scrape.js \
  --endpoint /company-jobs --company "<employer_name from step 1>" --location "Columbus, OH" \
  --count 50 --format csv --output output/monster_employer_jobs.csv
```

Finds who is hiring for a role in a city, then pulls each employer's full local job list.
