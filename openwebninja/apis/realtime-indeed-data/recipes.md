# realtime-indeed-data Recipes

## 1. Search Indeed jobs and export to CSV

```bash
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --query "registered nurse" --location "Dallas, TX" --date-posted week --count 50 --format csv
```

Exports up to 50 nurse jobs in Dallas posted in the last 7 days, with full descriptions, salaries, and the employer's own apply link.

## 2. Remote full-time roles above a salary floor, outside the US

```bash
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --query "data engineer" --country gb --work-from-home \
  --employment-types FULLTIME --min-salary 60000 --count 30 --format json
```

Searches the UK Indeed market for remote full-time data engineer jobs whose stated annual salary is at least 60,000 (jobs with no stated salary are excluded).

## 3. Get full details for specific jobs

```bash
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --endpoint /job-details --job-id "aW5kZWVkOjQ3NmU1ODZjZjJiOTFjNDY" --format json
```

Resolves up to 20 comma-separated job ids from `/search` in one call (a batch costs the same as a single id).

## 4. Pull a company's employee reviews

```bash
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --endpoint /company-reviews --company "Lutron-Electronics" --country ALL \
  --sort rating_asc --count 100 --format csv
```

Exports up to 100 reviews across every country, lowest rated first. The company's overall rating, category ratings, and star distribution are saved in the `.meta.json` manifest next to the CSV.

## 5. Chain: job search -> employer reviews

```bash
# Step 1: find jobs and note job_indeed_company_page_url on the employer you care about
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --query "software engineer" --location "New York, NY" \
  --fields "job_title,employer_name,job_indeed_company_page_url" --dry-run

# Step 2: pass that URL straight through as --company
node --env-file=.env apis/realtime-indeed-data/scrape.js \
  --endpoint /company-reviews --company "<job_indeed_company_page_url>" --topic mgmt --count 40
```

Goes from a job listing to what employees say about that employer's management, with no name matching (the company page URL is free, a free-text name costs one extra request).
