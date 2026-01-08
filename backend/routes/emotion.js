import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

// Create uploads folder if it doesn't exist
import { mkdirSync } from "fs";
mkdirSync(uploadsDir, { recursive: true });

const router = express.Router();
const upload = multer({ dest: uploadsDir });

router.post("/detect", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio uploaded" });

    const formData = new FormData();
    formData.append("audio", fs.createReadStream(req.file.path));

    const response = await axios.post("http://127.0.0.1:5001/predict", formData, {
      headers: formData.getHeaders()
    });

    res.json({ emotion: response.data.emotion });
  } catch (error) {
    console.error("Emotion detection error:", error.message);
    res.status(500).json({ error: "Emotion detection failed" });
  }
});

export default router;