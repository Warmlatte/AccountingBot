import https from "https";
import config from "../config/index.js";

// 記錄已回覆過的使用者 ID
const repliedUsers = new Set();

/**
 * 發送回覆訊息
 * @param {string} replyToken - LINE 回覆權杖
 * @param {Array|Object} messages - 訊息陣列或單一訊息物件
 * @returns {Promise} - HTTP 請求結果
 */
const replyMessage = (replyToken, messages) => {
  return new Promise((resolve, reject) => {
    // 如果傳入的是單一訊息物件，將其轉換成陣列
    const messageArray = Array.isArray(messages) ? messages : [messages];

    const dataString = JSON.stringify({
      replyToken: replyToken,
      messages: messageArray,
    });

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
    };

    // 設定發送到 LINE API 的請求參數
    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
    };

    // 發送回覆請求到 LINE API
    const request = https.request(webhookOptions, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(`失敗的狀態碼: ${response.statusCode}, 回應: ${data}`);
        }
      });
    });

    request.on("error", (err) => {
      console.error("❌ 發送訊息失敗：", err);
      reject(err);
    });

    request.write(dataString);
    request.end();
  });
};

/**
 * 主動發送訊息給特定用戶
 * @param {string} userId - 用戶 ID
 * @param {Array|Object} messages - 訊息陣列或單一訊息物件
 * @returns {Promise} - HTTP 請求結果
 */
const pushMessage = (userId, messages) => {
  return new Promise((resolve, reject) => {
    // 如果傳入的是單一訊息物件，將其轉換成陣列
    const messageArray = Array.isArray(messages) ? messages : [messages];

    const dataString = JSON.stringify({
      to: userId,
      messages: messageArray,
    });

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
    };

    // 設定發送到 LINE API 的請求參數
    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/push",
      method: "POST",
      headers: headers,
    };

    // 發送推送請求到 LINE API
    const request = https.request(webhookOptions, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(`失敗的狀態碼: ${response.statusCode}, 回應: ${data}`);
        }
      });
    });

    request.on("error", (err) => {
      console.error("❌ 推送訊息失敗：", err);
      reject(err);
    });

    request.write(dataString);
    request.end();
  });
};

/**
 * 獲取訊息內容（例如圖片、影片）
 * @param {string} messageId - 訊息 ID
 * @returns {Promise<ReadableStream>} - 返回內容串流
 */
const getMessageContent = (messageId) => {
  return new Promise((resolve, reject) => {
    const headers = {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
    };

    // 設定獲取訊息內容請求
    const options = {
      hostname: "api-data.line.me",
      path: `/v2/bot/message/${messageId}/content`,
      method: "GET",
      headers: headers,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(res);
      } else {
        let error = "";
        res.on("data", (chunk) => {
          error += chunk;
        });
        res.on("end", () => {
          reject(`獲取訊息內容失敗: ${res.statusCode}, ${error}`);
        });
      }
    });

    req.on("error", (err) => {
      console.error("❌ 獲取訊息內容失敗：", err);
      reject(err);
    });

    req.end();
  });
};

/**
 * 檢查使用者是否已回覆過
 * @param {string} userId - 使用者 ID
 * @returns {boolean} - 是否已回覆過
 */
const hasRepliedToUser = (userId) => {
  return repliedUsers.has(userId);
};

/**
 * 標記使用者已回覆
 * @param {string} userId - 使用者 ID
 */
const markUserAsReplied = (userId) => {
  repliedUsers.add(userId);
};

export default {
  replyMessage,
  pushMessage,
  getMessageContent,
  hasRepliedToUser,
  markUserAsReplied,
};
