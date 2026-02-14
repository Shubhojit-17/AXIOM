# Crypto Price API

Real-time cryptocurrency price lookup using the [CoinGecko](https://www.coingecko.com/en/api) public API. **No API key required.**

---

## Endpoints

### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "service": "crypto-price" }
```

### `GET /price?coin=<coin_id>`

Get the current USD price for a cryptocurrency.

**Query Parameters:**

| Param | Required | Description |
|---|---|---|
| `coin` | Yes | CoinGecko coin ID (e.g., `bitcoin`, `ethereum`, `solana`, `stacks`) |

**Example:**

```
GET /price?coin=bitcoin
```

**Response:**

```json
{
  "coin": "bitcoin",
  "usd": 52000
}
```

**Errors:**

| Status | Meaning |
|---|---|
| 400 | Missing `coin` query parameter |
| 404 | Coin not found on CoinGecko |
| 5xx | CoinGecko API or server error |

---

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3003) |

No API key is needed — CoinGecko's public endpoint is used.

## Deploy to Render

1. Set **Root Directory** to `crypto-price-api/`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. No environment variables required (PORT is set by Render automatically).
