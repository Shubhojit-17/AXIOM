# Sentiment Analyzer API

Analyze text sentiment (POSITIVE / NEGATIVE) using [HuggingFace Inference API](https://huggingface.co/inference-api).

**Model:** `distilbert-base-uncased-finetuned-sst-2-english`

---

## Endpoints

### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "service": "sentiment-analyzer" }
```

### `POST /sentiment`

Analyze the sentiment of a text string.

**Request Body (JSON):**

```json
{
  "text": "I love this product"
}
```

**Response:**

```json
{
  "success": true,
  "label": "POSITIVE",
  "score": 0.9998
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
| `PORT` | No | Server port (default: 3002) |

## Deploy to Render

1. Set **Root Directory** to `sentiment-api/`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. Add `HF_TOKEN` as an environment variable.
