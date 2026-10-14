# google-maps-traffic-alerts

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/google_maps_traffic_alerts.yaml

**Host:** `google-maps-traffic-alerts.p.rapidapi.com`

Get Real-Time Traffic Alerts from Google Maps (Road Closures, Construction, Accidents, and More), Including Type and Precise Coordinates for Any Geographic Area Worldwide.

## Endpoints

### GET /traffic-alerts
Traffic Alerts

Live traffic incidents (accidents, construction zones, road closures and other slowdowns) inside the bounding box defined by two corner coordinates, each with its incident type and precise latitude/longitude. The box area is capped per `zoom` level: a higher zoom returns finer detail over a smaller maximum area, so use a lower zoom (or several boxes) to scan a larger area.

**Required:**
- `bottom_left` (string) — bottom-left (south-west) corner as `latitude,longitude`. Example: `40.63,-74.10`
- `top_right` (string) — top-right (north-east) corner as `latitude,longitude`. Example: `40.81,-73.87`

**Optional:**
- `zoom` (integer, default: 13) — range: 11-16. Maximum box area per zoom: 11 = 8000 km², 12 = 2000 km², 13 = 500 km², 14 = 125 km², 15 = 30 km², 16 = 8 km²

**Pagination:** none (every alert in the box in one call)
**Response path:** `data.alerts`
**Key fields:** type, latitude, longitude
**Also in `data`:** count
**Also in `parameters`:** bottom_left, top_right, zoom

---
