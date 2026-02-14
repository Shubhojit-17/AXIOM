const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crypto-price" });
});

// ─── GET /price ──────────────────────────────────────────────────────────────

app.get("/price", async (req, res) => {
  try {
    const { coin } = req.query;

    if (!coin || typeof coin !== "string" || coin.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'coin' is required. Example: /price?coin=bitcoin",
      });
    }

    const coinId = coin.trim().toLowerCase();

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: coinId,
          vs_currencies: "usd",
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    if (!data[coinId] || data[coinId].usd === undefined) {
      return res.status(404).json({
        success: false,
        error: `Coin '${coinId}' not found. Use CoinGecko coin IDs (e.g., bitcoin, ethereum, solana).`,
      });
    }

    return res.json({
      coin: coinId,
      usd: data[coinId].usd,
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const detail =
        err.response.data?.error || err.response.statusText || "Unknown error";

      return res.status(status).json({
        success: false,
        error: `CoinGecko API error: ${detail}`,
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
