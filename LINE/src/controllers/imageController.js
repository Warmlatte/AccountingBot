import lineService from "../services/lineService.js";
import axios from "axios";
import FormData from "form-data";
import config from "../config/index.js";

// 從配置中獲取 n8nEndpoint
const n8nEndpoint = config.n8nEndpoint;

/**
 * 處理圖片訊息 - 只負責接收圖片並轉發到 n8n
 */
const handleImageMessage = async (event) => {
  try {
    console.log(`開始處理圖片訊息，用戶ID: ${event.source.userId}`);

    // 1. 獲取圖片數據
    const { buffer, userId } = await getImageData(event);
    console.log(`圖片已下載，大小: ${buffer.length} bytes`);

    // 2. 轉發到 n8n
    await sendToN8n(buffer, userId, event.replyToken);

    // 3. 暫時回應用戶
    await lineService.replyMessage(event.replyToken, {
      type: "text",
      text: "圖片處理中，請稍候... ⏳",
    });
  } catch (error) {
    console.error("圖片處理失敗:", error.message);

    // 發生錯誤時通知用戶
    try {
      await lineService.replyMessage(event.replyToken, {
        type: "text",
        text: "很抱歉，圖片處理失敗，請稍後再試。",
      });
    } catch (replyError) {
      console.error("無法傳送錯誤訊息:", replyError);
    }
  }
};

/**
 * 獲取圖片數據
 */
const getImageData = async (event) => {
  const messageId = event.message.id;
  const userId = event.source.userId;

  // 從 LINE 平台下載圖片
  const stream = await lineService.getMessageContent(messageId);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    userId,
  };
};

/**
 * 發送圖片到 n8n
 */
const sendToN8n = async (buffer, userId, replyToken) => {
  // 檢查 n8n 端點是否設置
  if (!n8nEndpoint) {
    throw new Error("未設置 N8N_ENDPOINT 環境變數");
  }

  // 建立表單數據
  const form = new FormData();
  form.append("file", buffer, {
    filename: "receipt.jpg",
    contentType: "image/jpeg",
  });
  form.append("user_id", userId);
  form.append("reply_token", replyToken);
  form.append("platform", "LINE");

  // 發送到 n8n
  console.log(`發送圖片到 n8n: ${n8nEndpoint}`);
  const response = await axios.post(n8nEndpoint, form, {
    headers: form.getHeaders(),
    timeout: 10000, // 10秒超時
  });

  console.log(`圖片已發送到 n8n，狀態: ${response.status}`);
  return response.status;
};

export default {
  handleImageMessage,
};
