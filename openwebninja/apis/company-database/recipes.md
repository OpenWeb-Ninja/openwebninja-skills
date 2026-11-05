# company-database Recipes

## 1. Size a company list before pulling it

```bash
node --env-file=.env apis/company-database/scrape.js \
  --industry "Software Development" --hq-country US --size-category-min LARGE --limit 5 --dry-run
```

One small call that prints `match_count` (every large US software company in the database) and a sample, so the number of calls for the full pull (500 companies per call) can be planned before running it.

## 2. Every company of an industry and size band, as CSV

```bash
node --env-file=.env apis/company-database/scrape.js \
  --industry "Software Development|Computer Hardware Development" --hq-country US \
  --size-category-min LARGE --count 1000 \
  --fields name,website_domain,industry,size_category,revenue,rating,review_count \
  --format csv --output output/us_large_software.csv
```

Several industries are separated with `|` because a comma can be part of an industry name; the script sends this as `POST /search` with an industry array. Up to 1,000 companies in 2 calls (500 per call, cursor pagination).

## 3. Enrich a list of domains or tickers with Glassdoor profiles

```bash
node --env-file=.env apis/company-database/scrape.js \
  --website-domain "microsoft.com,siemens.com,stripe.com" \
  --fields name,website_domain,hq_country,revenue,size,rating,review_count --format csv

node --env-file=.env apis/company-database/scrape.js \
  --stock-ticker "MSFT,NVDA" --fields name,stock_ticker,rating,recommend_to_friend_rating --dry-run
```

Up to 20 domains or tickers per call. A URL or `www.` host works as a domain: it is reduced to the bare domain before matching.

## 4. Find a company by name, then its full profile

```bash
node --env-file=.env apis/company-database/scrape.js --name "Microsoft" --limit 5 --dry-run

node --env-file=.env apis/company-database/scrape.js --employer-id 1651 --dry-run
```

Name search is full-text and ranked by match, so the best match comes first. `employer_id` is an exact lookup that returns the whole record (ratings, sub-ratings, revenue, size, mission, salary and job counts).

## 5. Young nonprofits or startups in a country

```bash
node --env-file=.env apis/company-database/scrape.js \
  --company-type NONPROFIT --hq-country GB --year-founded-min 2015 \
  --fields name,year_founded,website,size --count 200 --format csv
```

Founding-year and headcount ranges are inclusive. A company with no recorded founding year matches no year bound.

## 6. Chain: company list, then live Glassdoor reviews

```bash
# Step 1: large US software companies with their Glassdoor ids
node --env-file=.env apis/company-database/scrape.js \
  --industry "Software Development" --hq-country US --size-category LARGE --count 50 \
  --fields name,website_domain,rating,review_count --format json --output output/companies.json

# Step 2: employee reviews for one of them
node --env-file=.env apis/realtime-glassdoor-data/scrape.js \
  --endpoint /company-reviews --company-id "<employer_id>" --count 50 --format csv
```

The database holds the company profile and its ratings; `realtime-glassdoor-data` reads the reviews, salaries, interviews and job listings live from Glassdoor.
