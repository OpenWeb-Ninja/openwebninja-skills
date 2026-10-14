# reverse-image-search

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/reverse_image_search.yaml

**Host:** `reverse-image-search1.p.rapidapi.com`
**Notes:** Single-call API — pass an image URL and get up to 500 web pages that contain or are visually similar to the image. Use `limit` to control how many results are returned.

## Endpoints

### GET /reverse-image-search
Reverse Image Search — Send an image URL and get the top 500 source web pages.

**Required:**
- `url` (string) — Publicly accessible URL of the image to search Example: `https://i.imgur.com/HBrB8p0.png`

**Optional:**
- `limit` (integer, default: 500) — Number of results to return (1–500) Example: `50`
- `safe_search` (string, default: blur) — values: off, blur

**Pagination:** none
**Response path:** `data`
**Key fields:** title, link, domain, logo, date, image, image_width, image_height, price, availability (price / availability on product pages only)
