# Crypto Price API

Real-time cryptocurrency price lookup using the [Binance](https://www.binance.com/en/binance-api) public ticker API. **No API key required.**

Prices are cached in-memory for 30 seconds to avoid excessive requests.

---

## Supported Coins

| Query value | Binance Symbol |
|---|---|
| `bitcoin` / `btc` | BTCUSDT |
| `ethereum` / `eth` | ETHUSDT |
| `solana` / `sol` | SOLUSDT |

---

## Endpoints

### `GET /health`

Health check.

**Response:**

```json
{ "status": "ok", "service": "crypto-price", "source": "binance" }
```

### `GET /price?coin=<coin>`

Get the current USD price for a cryptocurrency.

**Query Parameters:**

| Param | Required | Description |
|---|---|---|
| `coin` | Yes | Coin name or ticker (e.g., `bitcoin`, `btc`, `ethereum`, `eth`, `solana`, `sol`) |

**Example:**

```bash
curl "https://your-app.onrender.com/price?coin=bitcoin"
```

**Response:**

```json
{
  "success": true,
  "coin": "bitcoin",
  "symbol": "BTCUSDT",
  "priceUsd": 43211.23,
  "source": "binance",
  "cached": false,
  "timestamp": "2026-02-14T12:30:00.000Z"
}
```

Subsequent requests within 30 seconds return `"cached": true`.

**Errors:**

| Status | Meaning |
|---|---|
| 400 | Missing or unsupported `coin` query parameter |
| 502 | Invalid data received from Binance |
| 504 | Binance API request timed out |
| 5xx | Binance API or server error |

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

No API key is needed — Binance's public ticker endpoint is used.

## Deploy to Render

1. Set **Root Directory** to `crypto-price-api/`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. No environment variables required (PORT is set by Render automatically).
