// 載入環境變數
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// 獲取 n8n 端點並確保其有效（如果環境變數中沒有，使用默認值）
const n8nUrl = process.env.N8N_ENDPOINT;

// 配置物件
const config = {
  port: process.env.PORT || 3000,
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
  n8nEndpoint: n8nUrl,
};

export default config;
