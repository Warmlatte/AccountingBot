import express from "express";
import messageController from "../controllers/messageController.js";
import textController from "../controllers/textController.js";
import lineService from "../services/lineService.js";
import invoiceController from "../controllers/invoiceController.js";

const router = express.Router();

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

// 接收聊天室訊息
router.post("/webhook", async (req, res) => {
  try {
    // 快速回應 LINE 平台以避免重試
    res.status(200).send("OK");

    if (
      !req.body.events ||
      !Array.isArray(req.body.events) ||
      req.body.events.length === 0
    ) {
      return;
    }

    const event = req.body.events[0];

    if (event.type === "message") {
      switch (event.message.type) {
        case "text":
          await messageController.handleTextMessage(event);
          break;
        case "sticker":
          await messageController.handleStickerMessage(event);
          break;
        case "image":
          await messageController.handleImageMessage(event);
          break;
        default:
          await textController.handleDefaultMessage(event.replyToken);
      }
    } else if (event.type === "postback") {
      // 處理 postback 事件
      await invoiceController.handlePostback(event);
    }
  } catch (error) {
    console.error("處理 LINE Webhook 錯誤:", error);
  }
});

// 統一的 OCR 結果接收端點
router.post("/receiveOcrData", async (req, res) => {
  try {
    const {
      reply_token,
      user_id,
      invoiceNumber = "未識別",
      date = "未識別",
      amount = "未識別",
      imageUrl = "",
      use_flex = false, // 新增參數，控制是否使用 Flex Message
    } = req.body;

    // 檢查是否有必要的參數
    if (!reply_token && !user_id) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數，需要 reply_token 或 user_id",
      });
    }

    // 清理資料，避免"null"字串
    const cleanInvoiceNumber = cleanValue(invoiceNumber, "未識別");
    const cleanDate = cleanValue(date, "未識別");
    const cleanAmount = cleanValue(amount, "未識別");

    // 根據提供的參數決定如何回覆
    if (reply_token && !use_flex) {
      // 使用 reply_token 直接回覆文字訊息
      const message = {
        type: "text",
        text: `📄 發票號碼：${cleanInvoiceNumber}\n📅 日期：${cleanDate}\n💰 金額：${cleanAmount}元`,
      };
      await lineService.replyMessage(reply_token, message);
    } else if (user_id) {
      // 使用 user_id 發送 Flex Message
      await messageController.replyOcrResultToLine({
        userId: user_id,
        invoiceNumber: cleanInvoiceNumber,
        date: cleanDate,
        amount: cleanAmount,
        imageUrl,
      });
    } else {
      // 如果有 reply_token 但也設置了 use_flex=true
      // 由於無法使用 reply_token 發送 Flex Message，我們發送文字訊息警告
      await lineService.replyMessage(reply_token, {
        type: "text",
        text: "回覆失敗",
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("處理 OCR 結果錯誤:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 接收n8n保存結果的通知
router.post("/notifySavedResult", async (req, res) => {
  try {
    const {
      user_id,
      category,
      amount,
      date,
      imageUrl,
      displayName,
      success = true,
      message = "",
    } = req.body;

    // 檢查必要參數
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "缺少必要參數 user_id",
      });
    }

    // 清理資料
    const cleanCategory = cleanValue(category, "未分類");
    const cleanAmount = cleanValue(amount, "未填寫");
    const cleanDate = cleanValue(date, "未填寫");
    const cleanImageUrl = cleanValue(imageUrl);
    const cleanDisplayName = cleanValue(displayName);

    // 處理重複發票號碼的情況
    if (message === "Invoice Number Repeat") {
      await invoiceController.sendInvoiceRepeatMessage(
        user_id,
        req.body.invoiceNumber
      );
      return res.status(200).json({ success: true, message: "已通知發票重複" });
    }

    // 如果保存成功
    if (success) {
      await invoiceController.sendSuccessMessage(
        user_id,
        cleanCategory,
        cleanAmount,
        cleanDate,
        cleanImageUrl,
        cleanDisplayName
      );
    } else {
      // 如果保存失敗
      const errorMessage = {
        type: "text",
        text: `❌ 記帳失敗\n${message || "請稍後再試"}`,
      };
      await lineService.pushMessage(user_id, errorMessage);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("處理保存結果通知錯誤:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 測試路由
router.get("/", (_req, res) => {
  res.status(200).send("LINE Bot 伺服器運行中");
});

export default router;
