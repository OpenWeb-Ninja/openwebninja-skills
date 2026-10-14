# gemini

> Full OpenAPI spec: https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/gemini.yaml

**Host:** `gemini24.p.rapidapi.com`
**Notes:** Single conversational response per call. Use conversation_id for multi-turn context.

## Endpoints

### POST /chat
Chat — Chat with Google Gemini with web access and continuous conversation support.

**Required (JSON body):**
- `message` (string) — Message to send to Google Gemini Example: `Hello`

**Optional (JSON body):**
- `conversation_id` (string) — continue a conversation; a new one is created when omitted
- `markdown` (boolean, default: true) — return the reply in markdown

**Pagination:** none
**Response path:** `data`
**Key fields:** reply_text, reference_links (title, link, snippet, source, favicon), conversation_id

---
