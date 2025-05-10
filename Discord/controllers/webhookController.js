import { client } from "../index.js";
import {
  createInvoiceEmbed,
  createSuccessEmbed,
  createDuplicateWarningEmbed,
} from "../utils/embedBuilder.js";
import {
  createCategorySelectMenu,
  createActionButtons,
} from "../utils/categoryOptions.js";
import { formatDate, getCategoryLabel } from "../controllers/dataController.js";
import dotenv from "dotenv";
import { EmbedBuilder } from "discord.js";

dotenv.config();

// 預設的 Discord 頻道 ID（請在 .env 中設定）
const DEFAULT_CHANNEL_ID = process.env.DEFAULT_CHANNEL_ID;

/**
 * 處理 OCR 辨識結果
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const handleOcrResult = async (req, res) => {
  const {
    invoiceNumber = "無法辨識",
    date: rawDate = "無法辨識",
    amount = "無法辨識",
    imageUrl,
    user_id,
    channel_id = DEFAULT_CHANNEL_ID, // 使用預設頻道 ID
  } = req.body;

  // 格式化日期
  const date = rawDate !== "無法辨識" ? formatDate(rawDate) : rawDate;

  // 驗證必要欄位
  if (!channel_id) {
    console.error("❌ 缺少頻道 ID");
    return res.status(400).send({ error: "缺少頻道 ID" });
  }

  if (!imageUrl) {
    console.error("❌ 缺少圖片連結");
    return res.status(400).send({ error: "缺少圖片連結" });
  }

  try {
    const channel = await client.channels.fetch(channel_id);

    if (!channel) {
      throw new Error(`找不到頻道 ${channel_id}`);
    }

    if (!channel.isTextBased()) {
      throw new Error(`頻道 ${channel_id} 不是文字頻道`);
    }

    // 建立 Embed
    const embed = createInvoiceEmbed(
      {
        invoiceNumber,
        date,
        amount,
        imageUrl,
      },
      client
    );

    // 建立分類選單
    const categoryRow = createCategorySelectMenu(
      "category_select",
      invoiceNumber
    );

    // 建立操作按鈕
    const actionRow = createActionButtons(invoiceNumber);

    // 建立訊息內容
    const messageContent = user_id
      ? `<@${user_id}> 您的發票已辨識完成，請選擇分類或修改資訊：`
      : "發票已辨識完成，請選擇分類或修改資訊：";

    // 發送訊息
    await channel.send({
      content: messageContent,
      embeds: [embed],
      components: [categoryRow, actionRow],
    });

    res.status(200).send({ success: true });
  } catch (err) {
    console.error("❌ 發送 Embed 失敗", err);

    // 根據錯誤類型返回適當的錯誤訊息
    if (err.code === 10003) {
      return res.status(404).send({
        error:
          "找不到指定的頻道，請確認頻道 ID 是否正確，以及機器人是否有權限訪問該頻道",
      });
    }

    res.status(500).send({ error: err.message });
  }
};

/**
 * 處理 n8n 記帳結果通知
 * @param {Object} req - Express 請求物件
 * @param {Object} res - Express 回應物件
 */
export const handleSavedResult = async (req, res) => {
  try {
    const n8nResponse = req.body;

    const {
      repeat,
      user_id: userId,
      channel_id: channelId = DEFAULT_CHANNEL_ID,
      interactionId,
      invoiceNumber,
      date,
      amount,
      category,
      detail,
      imageUrl,
      displayName,
    } = n8nResponse;

    if (!userId) {
      console.error("❌ n8n 回應缺少 userId", n8nResponse);
      return res.status(400).send({ error: "n8n 回應缺少 userId" });
    }

    const discordChannel = await client.channels.fetch(channelId);
    if (!discordChannel || !discordChannel.isTextBased()) {
      console.error(`❌ 找不到合適的頻道 ${channelId}`);
      return res
        .status(200)
        .send({ success: true, warning: "Channel not found but processed" });
    }

    let userNotificationContent = "";
    let publicEmbedToSend = null;
    let status = "error";

    const formattedDate = formatDate(date || "");
    const categoryLabel = getCategoryLabel(category);

    if (repeat === true) {
      status = "repeat";
      const anInvoiceNumber = invoiceNumber || "N/A";
      userNotificationContent = `⚠️ 記帳警告：發票號碼 ${anInvoiceNumber} 可能已經記錄過了！請檢查是否重複記帳。如果您確定這不是重複記帳，請聯絡管理員。`;

      publicEmbedToSend = createDuplicateWarningEmbed({
        userId,
        invoiceNumber: anInvoiceNumber,
      });
    } else if (repeat === false && amount) {
      status = "success";
      userNotificationContent = `✅ 記帳成功！
📄 發票號碼：${invoiceNumber || "未提供"}
📅 日期：${formattedDate || "未提供"}
💰 金額：NT$ ${amount || "未提供"}
🏷️ 分類：${categoryLabel || "未分類"}
📝 明細：${detail || "無明細"}

謝謝您使用發票記帳機器人！`;

      publicEmbedToSend = createSuccessEmbed({
        userId,
        invoiceNumber,
        amount,
        categoryLabel,
        imageUrl,
      });
    } else {
      status = "error";
      userNotificationContent = `❌ 處理記帳結果時發生問題。
請聯絡管理員，並提供以下資訊以供排查：
發票號碼: ${invoiceNumber || "N/A"}
使用者: ${displayName || userId}
收到的原始資料: 
\`\`\`json
${JSON.stringify(n8nResponse, null, 2)}
\`\`\``;
      publicEmbedToSend = null;
    }

    if (interactionId && userNotificationContent) {
      try {
        const messages = await discordChannel.messages.fetch({ limit: 20 });
        const interactionMessage = messages.find(
          (msg) => msg.interaction && msg.interaction.id === interactionId
        );
        if (interactionMessage) {
          await interactionMessage.edit({
            content: userNotificationContent,
            components: [],
            embeds: [],
          });
        } else {
          if (status !== "success") {
            await discordChannel.send({
              content: `<@${userId}> ${userNotificationContent}`,
            });
          }
        }
      } catch (err) {
        console.error("❌ 更新互動訊息失敗，嘗試發送新訊息:", err);
        if (status !== "success") {
          await discordChannel.send({
            content: `<@${userId}> ${userNotificationContent}`,
          });
        }
      }
    } else if (
      userNotificationContent &&
      status !== "success" &&
      status !== "repeat"
    ) {
      await discordChannel.send({
        content: `<@${userId}> ${userNotificationContent}`,
      });
    } else if (
      userNotificationContent &&
      (status === "success" || status === "repeat") &&
      !interactionId
    ) {
      await discordChannel.send({
        content: `<@${userId}> ${userNotificationContent}`,
      });
    }

    if (publicEmbedToSend) {
      await discordChannel.send({ embeds: [publicEmbedToSend] });
    }

    return res.status(200).send({ success: true });
  } catch (err) {
    console.error("❌ 處理 n8n 記帳結果通知失敗:", err);
    return res.status(500).send({ error: err.message });
  }
};
