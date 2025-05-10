import express from "express";
import {
  handleOcrResult,
  handleSavedResult,
} from "../controllers/webhookController.js";

const router = express.Router();

// OCR 辨識結果路由
router.post("/ocr", handleOcrResult);

// n8n 記帳結果通知路由
router.post("/notifySavedResult", handleSavedResult);

export default router;
