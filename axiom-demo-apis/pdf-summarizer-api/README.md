# PDF Summarizer API

Upload a PDF, extract its text, and get an AI-generated summary using [HuggingFace Inference API](https://huggingface.co/inference-api).

**Model:** `SanthoshMamidisetti/Text-Summariser`

---

## Endpoints

### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "service": "pdf-summarizer" }
```

### `POST /summarize-pdf`

Upload a PDF file and receive a summary.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | A `.pdf` file (max 10 MB) |

**Example (cURL):**

```bash
curl -X POST http://localhost:3001/summarize-pdf \
  -F "file=@document.pdf"
```

**Response:**

```json
{
  "success": true,
  "pages": 4,
  "summary": "A shorter version of the PDF content.",
  "extractedTextPreview": "First 200 characters of extracted text..."
}
```

**Errors:**

| Status | Meaning |
|---|---|
| 400 | No file uploaded or not a PDF |
| 422 | PDF contains no extractable text |
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
| `PORT` | No | Server port (default: 3001) |

## Deploy to Render

1. Set **Root Directory** to `pdf-summarizer-api/`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. Add `HF_TOKEN` as an environment variable.
