const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentiment-analyzer" });
});

// ─── POST /sentiment ─────────────────────────────────────────────────────────

app.post("/sentiment", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Request body must include a non-empty 'text' field.",
      });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: HF_TOKEN is not set.",
      });
    }

    const MODEL_URL =
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";

    const response = await axios.post(
      MODEL_URL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const result = response.data;

    // HuggingFace returns [[{label, score}, ...]]
    if (
      !Array.isArray(result) ||
      !Array.isArray(result[0]) ||
      !result[0][0]?.label
    ) {
      return res.status(502).json({
        success: false,
        error: "Unexpected response from HuggingFace API.",
        raw: result,
      });
    }

    // Pick the top-scoring label
    const sorted = result[0].sort((a, b) => b.score - a.score);
    const top = sorted[0];

    return res.json({
      success: true,
      label: top.label,
      score: parseFloat(top.score.toFixed(4)),
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const detail =
        err.response.data?.error || err.response.statusText || "Unknown error";

      if (status === 503) {
        return res.status(503).json({
          success: false,
          error: "Model is loading. Please retry in a few seconds.",
          estimated_time: err.response.data?.estimated_time,
        });
      }

      return res.status(status).json({
        success: false,
        error: `HuggingFace API error: ${detail}`,
      });
    }

    console.error("Sentiment error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`sentiment-api running on port ${PORT}`);
});
