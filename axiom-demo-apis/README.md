# AXIOM Demo APIs

A collection of production-ready microservice APIs designed for the **AXIOM API Marketplace**. Each service is independently deployable and can be registered as an endpoint inside the AXIOM platform.

## Services

| Service | Port | Description | API Key Required |
|---|---|---|---|
| **Text Summarizer API** | 3000 | Summarize long text using HuggingFace | Yes (`HF_TOKEN`) |
| **PDF Summarizer API** | 3001 | Upload a PDF, extract text, and summarize | Yes (`HF_TOKEN`) |
| **Sentiment Analyzer API** | 3002 | Analyze text sentiment (positive/negative) | Yes (`HF_TOKEN`) |
| **Crypto Price API** | 3003 | Get real-time crypto prices via CoinGecko | No |

---

## Repository Structure

```
axiom-demo-apis/
├── text-summarizer-api/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── pdf-summarizer-api/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── sentiment-api/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── crypto-price-api/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
└── README.md
```

---

## Running Locally

### Prerequisites

- **Node.js** >= 18
- **npm** or **pnpm**
- A **HuggingFace API token** (free at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

### Steps (repeat for each service)

```bash
cd <service-folder>
npm install
cp .env.example .env
# Edit .env and add your HF_TOKEN (not needed for crypto-price-api)
npm run dev
```

The service will start on its default port (see table above).

---

## Deploying to Render (Free Tier)

Each service can be deployed as an individual **Web Service** on [Render](https://render.com).

### Steps

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect your GitHub repo.
4. Configure the service:

| Setting | Value |
|---|---|
| **Root Directory** | `text-summarizer-api/` (or whichever service) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

5. Add **Environment Variables**:
   - `HF_TOKEN` — your HuggingFace API token (not needed for crypto-price-api)
   - `PORT` — Render sets this automatically; no action needed.

6. Click **Create Web Service**. Render will build and deploy.

7. Repeat for each service, changing the **Root Directory** each time.

---

## Registering Endpoints Inside AXIOM

Once deployed, register each service in the AXIOM marketplace:

1. Navigate to the **AXIOM Developer Dashboard**.
2. Click **Register API**.
3. Fill in the details:

| Field | Example Value |
|---|---|
| **API Name** | Text Summarizer |
| **Base URL** | `https://text-summarizer-api-xxxx.onrender.com` |
| **Endpoint** | `/summarize` |
| **Method** | `POST` |
| **Price (STX)** | Set your price per call |
| **Description** | Summarize long text using AI |

4. Submit. The API will appear in the marketplace for consumers to discover and use.

---

## Health Checks

Every service exposes a `GET /health` endpoint that returns:

```json
{
  "status": "ok",
  "service": "<service-name>"
}
```

Use this to verify deployments and for uptime monitoring.

---

## License

MIT
