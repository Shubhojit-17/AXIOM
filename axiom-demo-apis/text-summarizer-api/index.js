const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "text-summarizer" });
});

// ─── POST /summarize ─────────────────────────────────────────────────────────

app.post("/summarize", async (req, res) => {
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
      "https://api-inference.huggingface.co/models/SanthoshMamidisetti/Text-Summariser";

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

    if (!Array.isArray(result) || !result[0]?.summary_text) {
      return res.status(502).json({
        success: false,
        error: "Unexpected response from HuggingFace API.",
        raw: result,
      });
    }

    return res.json({
      success: true,
      summary: result[0].summary_text,
      provider: "huggingface",
    });
  } catch (err) {
    // Handle HuggingFace-specific errors
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

    console.error("Summarize error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`text-summarizer-api running on port ${PORT}`);
});
