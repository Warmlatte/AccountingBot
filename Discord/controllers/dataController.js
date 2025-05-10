import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// n8n API 端點
const N8N_API_URL = `${process.env.N8N_URL}/saveWebhook`;
/**
 * 發送發票資料到 n8n 進行儲存
 *
 * @param {Object} data - 發票資料
 * @param {string} data.invoiceNumber - 發票號碼
 * @param {string} data.date - 日期
 * @param {string} data.amount - 金額
 * @param {string} data.imageUrl - 圖片 URL
 * @param {string} data.category - 消費分類
 * @param {string} data.detail - 消費明細
 * @param {string} data.userId - 使用者 ID
 * @param {string} data.username - 使用者名稱
 * @param {string} data.interactionId - 互動 ID（可選）
 * @returns {Promise<Object>} - n8n 的回應
 */
export const saveInvoiceData = async (data) => {
  try {
    // 構建發送到 n8n 的數據
    const payload = {
      ...data,
      // 添加類別的中文標籤
      categoryLabel: getCategoryLabel(data.category),
      // 添加一些其他可能有用的資訊
      timestamp: Date.now(),
      webhook_url: `${
        process.env.WEBHOOK_BASE_URL || "http://localhost:3000"
      }/webhook/notifySavedResult`,
    };

    const response = await axios.post(N8N_API_URL, payload, { timeout: 15000 });

    // 處理 n8n 的回應
    const responseData = response.data;

    // 檢查是否為重複發票的情況
    if (responseData && responseData.message === "Invoice Number Repeat") {
      return {
        message: "⚠️ 這張發票已經記錄過了！請檢查是否重複記帳。",
        warning: true,
        error: false,
        data: responseData,
      };
    }

    // 其他成功回應
    return {
      message: "記帳成功！資料已存入試算表。",
      error: false,
      data: responseData,
    };
  } catch (error) {
    console.error("❌ 發送資料至 n8n 失敗:", error);

    // 處理 timeout 特殊訊息
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        message: "流程處理錯誤：n8n 未於 15 秒內回應，請稍後再試或聯絡管理員。",
        error: true,
        errorDetails: error.message,
      };
    }

    // 檢查是否有回應資料
    if (error.response && error.response.data) {
      // 特別檢查是否為重複發票的錯誤訊息
      if (error.response.data.message === "Invoice Number Repeat") {
        return {
          message: "⚠️ 這張發票已經記錄過了！請檢查是否重複記帳。",
          warning: true,
          error: false,
          data: error.response.data,
        };
      }

      return {
        message: error.response.data.message || "記帳失敗，伺服器回應錯誤",
        error: true,
        errorDetails: error.response.data,
      };
    }

    // 一般性錯誤
    return {
      message: "記帳失敗，無法連接到伺服器",
      error: true,
      errorDetails: error.message,
    };
  }
};

/**
 * 將分類代碼轉換為中文標籤
 *
 * @param {string} categoryCode - 分類代碼
 * @returns {string} - 分類中文標籤
 */
export const getCategoryLabel = (categoryCode) => {
  const categoryMap = {
    food: "🍜 餐飲",
    transport: "🚗 交通",
    daily: "🏠 日用品",
    shopping: "🛒 購物",
    medical: "💊 醫療",
    education: "📚 教育",
    entertainment: "🎮 娛樂",
    communication: "📱 通訊",
    utilities: "⚡ 水電",
    others: "🏦 其他",
  };

  return categoryMap[categoryCode] || categoryCode;
};

/**
 * 格式化日期為 YYYY-MM-DD 格式
 *
 * @param {string} dateString - 日期字串，可以是 YYYYMMDD 或 YYYY-MM-DD 格式
 * @returns {string} - 格式化後的日期字串 (YYYY-MM-DD)
 */
export const formatDate = (dateString) => {
  // 移除所有非數字字符
  const digitsOnly = dateString.replace(/\D/g, "");

  // 確認是否為 8 位數的日期格式 (YYYYMMDD)
  if (digitsOnly.length === 8) {
    const year = digitsOnly.substring(0, 4);
    const month = digitsOnly.substring(4, 6);
    const day = digitsOnly.substring(6, 8);

    return `${year}-${month}-${day}`;
  }

  // 如果已經是正確格式或無法格式化，則返回原始值
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  // 嘗試使用 Date 對象來解析日期
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      // 月份需要 +1 因為 JavaScript 中月份從 0 開始
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error("日期格式化錯誤:", error);
  }

  // 如果所有嘗試都失敗，返回原始字串
  return dateString;
};

/**
 * 獲取使用者的名稱
 *
 * @param {Object} client - Discord 客戶端
 * @param {string} userId - 使用者 ID
 * @returns {Promise<string>} - 使用者名稱
 */
export const getUserName = async (client, userId) => {
  try {
    const user = await client.users.fetch(userId);
    return user.username;
  } catch (error) {
    console.error("❌ 獲取使用者名稱失敗:", error);
    return "未知使用者";
  }
};
