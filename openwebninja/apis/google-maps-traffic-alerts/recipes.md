# google-maps-traffic-alerts Recipes

## 1. Live traffic incidents across Manhattan

```bash
node --env-file=.env apis/google-maps-traffic-alerts/scrape.js \
  --bbox "40.70,-74.02|40.80,-73.93" --format csv
```

One call returns every current Google Maps traffic alert in the box (default zoom 13, up to 500 km²) with its type and coordinates.

## 2. Quick check for road closures in a small area

```bash
node --env-file=.env apis/google-maps-traffic-alerts/scrape.js \
  --bbox "51.50,-0.14|51.52,-0.10" --zoom 15 --dry-run
```

Prints the alerts in a small central-London box at zoom 15 (finer detail, up to 30 km²) without saving a file.

## 3. Cover a wider region with several boxes

```bash
node --env-file=.env apis/google-maps-traffic-alerts/scrape.js \
  --bbox "33.70,-118.50|34.10,-118.10;33.70,-118.10|34.10,-117.70" --zoom 12 \
  --format json --output output/la_traffic_alerts.json
```

Scans two adjacent Los Angeles boxes at zoom 12 (up to 2000 km² each), one call per box, and deduplicates alerts that fall on the shared edge.

## 4. Multi-API: traffic incidents vs. Waze reports for the same area

```bash
# Step 1: Google Maps traffic alerts
node --env-file=.env apis/google-maps-traffic-alerts/scrape.js \
  --bbox "40.70,-74.02|40.80,-73.93" --output output/gmaps_alerts.json

# Step 2: Waze alerts and jams for the same box
node --env-file=.env apis/waze/scrape.js \
  --bbox "40.70,-74.02|40.80,-73.93" --max-alerts 50 --max-jams 50 --output output/waze_alerts.json
```

Compares Google Maps incidents with Waze driver reports and jams for the same area.
