# ev-charge-finder — Recipes

> Connector filters (`--connector-type`, `--available`, `--min-kw`, `--max-kw`) are currently not supported: Google is not providing connector data, so the API refuses them with a 400 (not billed), and `connectors` is null on every station.

## 1. Find EV chargers near a city

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ev-charge-finder/scrape.js \
  --location "San Francisco, CA, USA" --count 50 --format json
```

Exports up to 50 EV charging stations near San Francisco as JSON.

## 2. Find one charging network (Tesla)

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ev-charge-finder/scrape.js \
  --location "Los Angeles, CA, USA" --query tesla --count 30 --format csv
```

Finds Tesla charging stations near LA and exports as CSV.

## 3. Search by exact coordinates

```bash
node --env-file=.env openwebninja_universal_scraper/apis/ev-charge-finder/scrape.js \
  --lat 37.359428 --lng -121.925337 --count 20 --format json
```

Finds the 20 nearest stations to exact GPS coordinates (e.g. Sunnyvale).

## 4. Chain: find EV chargers along a driving route

```bash
# Step 1 — get the route
node --env-file=.env openwebninja_universal_scraper/apis/driving-directions/scrape.js \
  --origin "San Francisco, CA, USA" --destination "Los Angeles, CA, USA" --format json --output output/route_sf_la.json

# Step 2 — find chargers near the midpoint (Paso Robles)
node --env-file=.env openwebninja_universal_scraper/apis/ev-charge-finder/scrape.js \
  --location "Paso Robles, CA, USA" --count 10 --format json --output output/chargers_midpoint.json
```

Gets driving directions SF to LA, then finds chargers near the midpoint for a road-trip charging stop.
