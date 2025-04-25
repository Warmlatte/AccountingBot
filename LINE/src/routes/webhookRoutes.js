import express from "express";
import messageController from "../controllers/messageController.js";
import textController from "../controllers/textController.js";
import lineService from "../services/lineService.js";

const router = express.Router();

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
    // console.log(
    //   `接收到 LINE 事件: ${event.type}, 訊息類型: ${event.message?.type}`
    // );

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
          console.log(`不支援的訊息類型: ${event.message.type}`);
          await textController.handleDefaultMessage(event.replyToken);
      }
    }
  } catch (error) {
    console.error("處理 LINE Webhook 錯誤:", error);
  }
});

// 統一的 OCR 結果接收端點
router.post("/receiveOcrData", async (req, res) => {
  try {
    // console.log("從 n8n 接收 OCR 結果", req.body);

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

    // 根據提供的參數決定如何回覆
    if (reply_token && !use_flex) {
      // 使用 reply_token 直接回覆文字訊息
      const message = {
        type: "text",
        text: `📄 發票號碼：${invoiceNumber}\n📅 日期：${date}\n💰 金額：${amount}元`,
      };
      await lineService.replyMessage(reply_token, message);
      // console.log("已成功使用文字回覆用戶");
    } else if (user_id) {
      // 使用 user_id 發送 Flex Message
      await messageController.replyOcrResultToLine({
        userId: user_id,
        invoiceNumber,
        date,
        amount,
        imageUrl,
      });
      // console.log(`已使用 Flex Message 回覆用戶 ${user_id}`);
    } else {
      // 如果有 reply_token 但也設置了 use_flex=true
      // 由於無法使用 reply_token 發送 Flex Message，我們發送文字訊息警告
      await lineService.replyMessage(reply_token, {
        type: "text",
        text: "回覆失敗",
      });
      console.log("無法處理 Flex Message 回覆請求");
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

// 測試路由
router.get("/", (_req, res) => {
  res.status(200).send("LINE Bot 伺服器運行中");
});

export default router;
