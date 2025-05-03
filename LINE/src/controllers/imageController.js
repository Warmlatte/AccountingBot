import lineService from "../services/lineService.js";
import axios from "axios";
import FormData from "form-data";
import config from "../config/index.js";

// 從配置中獲取 n8nOcrWebhook
const n8nOcrWebhook = config.n8nOcrWebhook;

/**
 * 清理字串形式的null值，統一轉換為空字串
 * @param {string} value - 輸入值
 * @param {string} defaultValue - 默認值，如果輸入為null/undefined/"null"，返回此值
 * @returns {string} 清理後的值
 */
const cleanValue = (value, defaultValue = "") => {
  if (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "undefined"
  ) {
    return defaultValue;
  }
  return value;
};

/**
 * 處理圖片訊息 - 只負責接收圖片並轉發到 n8n
 */
const handleImageMessage = async (event) => {
  try {
    // 1. 獲取圖片數據
    const { buffer, userId } = await getImageData(event);

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
  // 檢查 n8n OCR 端點是否設置
  if (!n8nOcrWebhook) {
    throw new Error("未設置 N8N_ENDPOINT 環境變數或 n8nOcrWebhook 未配置");
  }

  // 建立表單數據
  const form = new FormData();
  form.append("file", buffer, {
    filename: "receipt.jpg",
    contentType: "image/jpeg",
  });
  form.append("user_id", cleanValue(userId));
  form.append("reply_token", cleanValue(replyToken));
  form.append("platform", "LINE");

  try {
    const response = await axios.post(n8nOcrWebhook, form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30秒超時，增加處理大圖片的時間
    });
    return response.status;
  } catch (error) {
    if (error.response) {
      // 伺服器返回了錯誤狀態碼
      console.error(
        `伺服器錯誤 (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.request) {
      // 沒有收到回應
      console.error("沒有收到n8n回應，請檢查連接或n8n伺服器是否運行");
    } else {
      // 請求設置時發生錯誤
      console.error("發送請求時發生錯誤:", error.message);
    }
    throw error;
  }
};

export default {
  handleImageMessage,
};
