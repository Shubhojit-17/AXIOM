const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Multer — store file in memory (max 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "pdf-summarizer" });
});

// ─── POST /summarize-pdf ────────────────────────────────────────────────────

app.post("/summarize-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Send a PDF as multipart/form-data field 'file'.",
      });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "Server misconfiguration: HF_TOKEN is not set.",
      });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: "Could not extract any text from the uploaded PDF.",
      });
    }

    // Truncate to ~4000 chars to stay within model input limits
    const truncatedText = extractedText.substring(0, 4000);

    const MODEL_URL =
      "https://api-inference.huggingface.co/models/SanthoshMamidisetti/Text-Summariser";

    const hfResponse = await axios.post(
      MODEL_URL,
      { inputs: truncatedText },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const result = hfResponse.data;

    if (!Array.isArray(result) || !result[0]?.summary_text) {
      return res.status(502).json({
        success: false,
        error: "Unexpected response from HuggingFace API.",
        raw: result,
      });
    }

    return res.json({
      success: true,
      pages: pdfData.numpages,
      summary: result[0].summary_text,
      extractedTextPreview: extractedText.substring(0, 200),
    });
  } catch (err) {
    // Multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err.message === "Only PDF files are allowed.") {
      return res.status(400).json({ success: false, error: err.message });
    }

    // HuggingFace errors
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

    console.error("PDF summarize error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
});

// ─── Global error handler for multer ─────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message === "Only PDF files are allowed.") {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error("Unhandled error:", err.message);
  return res.status(500).json({ success: false, error: "Internal server error." });
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`pdf-summarizer-api running on port ${PORT}`);
});
