const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// ─── Coin Name → Binance Symbol Mapping ──────────────────────────────────────

const COIN_MAP = {
  bitcoin: "BTCUSDT",
  btc: "BTCUSDT",
  ethereum: "ETHUSDT",
  eth: "ETHUSDT",
  solana: "SOLUSDT",
  sol: "SOLUSDT",
};

const SUPPORTED_COINS = [...new Set(Object.values(COIN_MAP))].map((s) =>
  s.replace("USDT", "").toLowerCase()
);

// ─── In-Memory Cache (30s TTL) ──────────────────────────────────────────────

const CACHE_TTL_MS = 30_000;
const cache = {}; // { [symbol]: { price: number, timestamp: number } }

function getCached(symbol) {
  const entry = cache[symbol];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry;
  }
  return null;
}

function setCache(symbol, price) {
  cache[symbol] = { price, timestamp: Date.now() };
}

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crypto-price", source: "binance" });
});

// ─── GET /price ──────────────────────────────────────────────────────────────

app.get("/price", async (req, res) => {
  try {
    const { coin } = req.query;

    if (!coin || typeof coin !== "string" || coin.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Query parameter 'coin' is required. Example: /price?coin=bitcoin",
      });
    }

    const coinId = coin.trim().toLowerCase();
    const symbol = COIN_MAP[coinId];

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: `Unsupported coin. Supported: ${SUPPORTED_COINS.join(", ")}`,
      });
    }

    // Check cache first
    const cached = getCached(symbol);
    if (cached) {
      return res.json({
        success: true,
        coin: coinId,
        symbol,
        priceUsd: cached.price,
        source: "binance",
        cached: true,
        timestamp: new Date(cached.timestamp).toISOString(),
      });
    }

    // Fetch from Binance
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price",
      {
        params: { symbol },
        timeout: 10000,
      }
    );

    const priceUsd = parseFloat(response.data.price);

    if (isNaN(priceUsd)) {
      return res.status(502).json({
        success: false,
        error: "Received invalid price data from Binance.",
      });
    }

    // Store in cache
    setCache(symbol, priceUsd);

    return res.json({
      success: true,
      coin: coinId,
      symbol,
      priceUsd,
      source: "binance",
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        error: "Binance API request timed out. Please try again.",
      });
    }

    if (err.response) {
      const status = err.response.status;
      const detail =
        err.response.data?.msg || err.response.statusText || "Unknown error";

      return res.status(status).json({
        success: false,
        error: `Binance API error: ${detail}`,
      });
    }

    console.error("Crypto price error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`crypto-price-api running on port ${PORT}`);
});
