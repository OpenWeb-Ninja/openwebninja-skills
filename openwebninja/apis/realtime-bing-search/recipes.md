# realtime-bing-search Recipes

## 1. Bing web results for a query

```bash
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --query "best project management software" --time-period last_month --format csv
```

Exports Bing's organic results (up to 10) from the last month with title, link, domain, snippet and position.

## 2. Latest Bing News on a topic

```bash
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /news --query "nvidia" --sort-by DATE --time-period last_day --count 50 --format json
```

Pulls up to 50 articles from the last 24 hours, newest first, with publisher, thumbnail and ISO publication time.

## 3. Licensed images for content

```bash
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /images --query "mountain lake sunrise" --usage-rights free_to_modify_commercially \
  --aspect-ratio wide --size large --count 70 --format csv
```

Collects up to 70 large, wide images Bing classifies as free to modify and use commercially, with full-size URL, dimensions and source page.

## 4. Short YouTube videos from the last month

```bash
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /videos --query "python tutorial for beginners" --source-site youtube.com \
  --duration short --time-period last_month --dry-run
```

Previews short (under 5 minutes) YouTube videos published in the last month, with channel, views and duration.

## 5. Chain: Bing Shopping search -> full product details with every store offer

```bash
# Step 1: find products and their product_id
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /shopping --query "coffee maker" --sort-by LOWEST_PRICE --min-price 50 --max-price 150 \
  --count 36 --format json --output output/bing_coffee_makers.json

# Step 2: pass a product_id from step 1 to get specs, review insights and all offers
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /product-details --product-id "<product_id from step 1>" --format json
```

Finds coffee makers between $50 and $150 cheapest first, then loads one product's description, specifications, AI review summary, pros/cons and every store's price and shipping for a price comparison.

## 6. Local places on Bing Maps around a point

```bash
node --env-file=.env apis/realtime-bing-search/scrape.js \
  --endpoint /maps --query "dentist" --lat 34.0522 --lng -118.2437 --limit 50 --count 100 --format csv
```

Exports up to 100 dentists around downtown Los Angeles (Bing serves at most 100 places per query) with address, phone, website, rating and opening status.
