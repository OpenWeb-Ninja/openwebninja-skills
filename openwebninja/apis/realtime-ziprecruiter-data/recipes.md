# realtime-ziprecruiter-data Recipes

## 1. Search ZipRecruiter jobs and export to CSV

```bash
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --query "registered nurse" --location "Houston, TX" --date-posted week --count 60 --format csv
```

Exports up to 60 nurse jobs in Houston posted in the last 7 days (3 pages of 20), with salary, apply type, and company id. Descriptions are a short teaser unless `--include-details` is set.

## 2. Full descriptions for remote, salaried roles in Canada

```bash
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --query "software engineer" --location "Toronto, ON" --remote-jobs-only \
  --salary-min 90000 --include-details --count 20 --format json
```

Returns up to 20 remote Toronto jobs stating at least 90,000/year, with `job_description`, `job_highlights`, and company fields filled (one extra request per job).

## 3. Every open job at one company

```bash
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --query "engineer" --company-id "<ziprecruiter_company_id>" --location "Seattle, WA" --count 100
```

Scopes the search to the `ziprecruiter_company_id` taken from any earlier result. Send `--location` with it so ZipRecruiter keeps the filter.

## 4. Salary distribution for a title in one state

```bash
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --endpoint /estimated-salary --job-title "Registered Nurse" --location "New York" --dry-run
```

Prints the annual min/median/max, p25/p75, histogram, per-state table, and top-paying cities for registered nurses in New York state (omit `--location` for the national figure).

## 5. Chain: job search -> job details

```bash
# Step 1: card-only search (cheap), note the job_id values you want
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --query "data analyst" --location "Chicago, IL" \
  --fields "job_id,job_title,employer_name,job_salary_string" --dry-run

# Step 2: full details for up to 20 of them in one call
node --env-file=.env apis/realtime-ziprecruiter-data/scrape.js \
  --endpoint /job-details --job-id "<job_id_1>,<job_id_2>,<job_id_3>" --format json
```

Searches cheaply on cards, then fetches full descriptions only for the jobs worth reading (billed one request per id).
