# realtime-events-search

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/realtime_events_data.yaml

**Host:** `real-time-events-search.p.rapidapi.com`
**Notes:** No pagination: Google shows a fixed set of up to 10 events per query. Use an event-style query (e.g. `concerts in new york this weekend`); a plain query may return an empty list.

## Endpoints

### GET /search-events
Search Events — Search for local and online events in real-time, as shown on Google's Events feature inside Google Search results. Google shows a fixed set of up to 10 events per query.

**Required:**
- `query` (string) — Search query / keyword. Example: `Concerts in San-Francisco`

**Optional:**
- `date` (string, default: any) — values: any, today, tomorrow, week, weekend, next_week, month, next_month
- `is_virtual` (boolean, default: false) Example: `false`

**Pagination:** none
**Response path:** `data` (array of events)
**Key fields:** event_id, name, link, description, date_human_readable, start_time, start_time_utc, end_time, end_time_utc, is_virtual, price, is_free, thumbnail, ticket_links, info_links, venue, publisher, publisher_domain

---

### GET /event-details
Event Details — Get the details of a specific event by Event ID (i.e. *event_id* field of an event returned by /search-events). The event_id is a temporary token: when it expires the endpoint returns 404 and the search should be re-run. /search-events already returns full details for every event.

**Required:**
- `event_id` (string) — The ID of the event to fetch (i.e. event_id field of an event). Example: `L2F1dGhvcml0eS9ob3Jpem9uL2NsdXN0ZXJlZF9ldmVudC8yMDI0LTExLTIyfDE2OTA0Nzc5MjUwNzQwODY5OTc4`

**Pagination:** none

---
