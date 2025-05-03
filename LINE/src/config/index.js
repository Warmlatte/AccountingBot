// 載入環境變數
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// 獲取 n8n 基礎端點
const n8nBaseUrl = process.env.N8N_ENDPOINT;

// 配置物件
const config = {
  port: process.env.PORT || 3000,
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
  n8nBaseUrl: n8nBaseUrl,
  n8nOcrWebhook: `${n8nBaseUrl}/ocrWebhook`,
  n8nSaveWebhook: `${n8nBaseUrl}/saveWebhook`,
};

export default config;
