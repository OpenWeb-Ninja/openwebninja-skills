# local-business-database Recipes

## 1. Size a lead list before pulling it

```bash
node --env-file=.env apis/local-business-database/scrape.js \
  --main-business-category "Dentist" --state TX --country US --limit 5 --dry-run
```

One small call that prints `match_count` (every dentist in Texas in the database) and a sample, so the number of calls for the full pull (500 businesses per call) can be planned before running it.

## 2. Every business of a category in a state, as CSV

```bash
node --env-file=.env apis/local-business-database/scrape.js \
  --main-business-category "Plumber" --state TX --country US --count 2000 \
  --fields business_id,name,phone,website,address,city,zipcode,rating,review_count \
  --format csv --output output/tx_plumbers.csv
```

Pulls up to 2,000 Texas plumbers in 4 calls (500 per call, cursor pagination) with the columns a lead list needs.

## 3. Several cities or ZIP codes in one query

```bash
node --env-file=.env apis/local-business-database/scrape.js \
  --business-category "coffee shop" --city "Chicago|Evanston|Oak Park" --count 1000 --format csv
```

Cities are separated with `|` because a comma can be part of a city name; the script sends this as `POST /search` with a city array. ZIP codes use commas: `--zipcode "60602,60603,60604"`.

## 4. Everything inside a map area

```bash
# Bounding box
node --env-file=.env apis/local-business-database/scrape.js \
  --endpoint /area-search-by-bounding-box --bbox "41.87,-87.64|41.89,-87.62" \
  --business-category restaurant --count 500 --format json

# Radius (meters) around a point
node --env-file=.env apis/local-business-database/scrape.js \
  --endpoint /area-search-by-radius --lat 41.8827 --lng -87.6233 --radius 1500 --count 500 --format csv
```

Lists every restaurant inside a box in downtown Chicago, or every business within 1.5 km of a point.

## 5. Full records, live reviews and photos for a business

```bash
node --env-file=.env apis/local-business-database/scrape.js \
  --endpoint /business-details --business-ids "0x102b644d009e013:0xea49e9ee285fa7bf" --dry-run

node --env-file=.env apis/local-business-database/scrape.js \
  --endpoint /business-reviews --business-id "0x102b644d009e013:0xea49e9ee285fa7bf" \
  --sort-by newest --count 100 --format csv

node --env-file=.env apis/local-business-database/scrape.js \
  --endpoint /business-photos --business-id "0x102b644d009e013:0xea49e9ee285fa7bf" --count 50
```

Business Details adds menu, popular times, services and price tier (up to 500 ids per call). Reviews (20 per page) and photos are read live from Google Maps.

## 6. Chain: database lead list, then emails and social profiles

```bash
# Step 1: every claimed med spa in Florida with a website
node --env-file=.env apis/local-business-database/scrape.js \
  --main-business-category "Medical spa" --state FL --verified true --count 500 \
  --fields business_id,name,website,phone,city --format json --output output/fl_medspas.json

# Step 2: pass the website domains (up to 20 per batch) to the contacts scraper
node --env-file=.env apis/website-contacts-scraper/scrape.js \
  --domains "<domain1>,<domain2>,..." --format csv --output output/fl_medspas_contacts.csv
```

The database has no emails or social profiles; `website-contacts-scraper` adds them from each business's website.
