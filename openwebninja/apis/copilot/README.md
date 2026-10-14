# copilot

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/copilot.yaml

**Host:** `copilot5.p.rapidapi.com`
**Notes:** Single conversational response per call. Use conversation_id for multi-turn context.

## Endpoints

### POST /copilot
Copilot — Chat with Copilot with web access and continuous conversation support. Answers are localized to the requested country (`country`, default us).

**Optional (JSON body):**
- `message` (string) — Message to send to Copilot Example: `Hello`
- `conversation_id` (string) — continue a conversation; a new one is created when omitted Example: `BEo5jhxYmas6nphKeTbyL`
- `mode` (string) — CHAT (normal), REASONING, or SMART (GPT-5) Example: `CHAT`
- `markdown` (boolean) — return the reply in markdown (plain text by default) Example: `true`
- `country` (string) — 2-letter country code the answer is localized to (default: us) Example: `us`

**Pagination:** none
**Response path:** `data`
**Key fields:** message, citations (title, url, publisher, icon_url), conversation_id

---
