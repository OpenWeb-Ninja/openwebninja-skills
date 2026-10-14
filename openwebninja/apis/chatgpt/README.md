# chatgpt

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/chatgpt.yaml

**Host:** `chatgpt194.p.rapidapi.com`
**Notes:** Single conversational response per call. No pagination.

## Endpoints

### POST /chat
Chat — Chat with OpenAI ChatGPT with support for continuous conversation and markdown/plain-text.

**Required (JSON body):**
- `message` (string) — Message to send to ChatGPT Example: `Hello`

**Optional (JSON body):**
- `markdown` (boolean, default: true) — return the reply in markdown

**Pagination:** none
**Response path:** `data`
**Key fields:** reply_text, content_references (sources, images, videos)

---
