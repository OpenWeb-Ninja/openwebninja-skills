# ai-overviews Recipes

Uses `apis/ai-overviews/scrape.js`.

## 1. Fetch the AI Overview for a factual question

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
  --query "what causes inflation" --dry-run
```

Returns Google's AI-generated overview for the query, including structured text parts and reference links.

## 2. Save an AI Overview to JSON for content research

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
  --query "how does CRISPR gene editing work" \
  --format json --output output/ai-overview-crispr.json
```

Fetches the AI Overview and saves the full structured response to a JSON file for analysis.

## 3. Check AI Overview in a specific country and language

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
  --query "best programming languages 2025" \
  --country gb --language en --dry-run
```

Retrieves the AI Overview as seen by a UK-based English-language user.

## 4. Batch AI Overview research for multiple topics

```bash
for query in "climate change effects" "renewable energy sources" "electric vehicle adoption"; do
  node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
    --query "$query" \
    --format json --output "output/ai-overview-$(echo $query | tr ' ' '-').json"
done
```

Loops over multiple queries and saves each AI Overview to a separate JSON file for content mapping.

## 5. Cross-API: AI Overview + full organic results for the same query

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ai-overviews/scrape.js \
  --query "best CRM software" --dry-run

node --env-file=.env openwebninja_universal_scraper/apis/realtime-web-search/scrape.js \
  --query "best CRM software" --count 20 --format json \
  --output output/crm-organic-results.json
```

Fetches both the AI Overview summary and the underlying organic results for the same query, enabling side-by-side comparison.
