# Text Summarizer API

AI-powered text summarization service using [HuggingFace Inference API](https://huggingface.co/inference-api).

**Model:** `SanthoshMamidisetti/Text-Summariser`

---

## Endpoints

### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "service": "text-summarizer" }
```

### `POST /summarize`

Summarize a block of text.

**Request Body (JSON):**

```json
{
  "text": "Your long text to summarize goes here..."
}
```

**Response:**

```json
{
  "success": true,
  "summary": "A shorter version of the text.",
  "provider": "huggingface"
}
```

**Errors:**

| Status | Meaning |
|---|---|
| 400 | Missing or empty `text` field |
| 500 | `HF_TOKEN` not configured |
| 502 | Unexpected HuggingFace response |
| 503 | Model is loading — retry after a few seconds |

---

## Setup

```bash
npm install
cp .env.example .env
# Add your HuggingFace token to .env
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HF_TOKEN` | Yes | HuggingFace API token |
| `PORT` | No | Server port (default: 3000) |

## Deploy to Render

1. Set **Root Directory** to `text-summarizer-api/`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. Add `HF_TOKEN` as an environment variable.
