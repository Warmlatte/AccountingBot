import {
  Events,
  InteractionType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import axios from "axios";
import {
  createEditInvoiceModal,
  createDetailsModal,
} from "../utils/categoryOptions.js";
import {
  createInvoiceEmbed,
  createProcessingEmbed,
  createConfirmationEmbed,
} from "../utils/embedBuilder.js";
import {
  saveInvoiceData,
  getCategoryLabel,
  getUserName,
  formatDate,
} from "../controllers/dataController.js";

// 儲存使用者的發票資料狀態
const invoiceDataStore = new Map();

/**
 * 處理斜線命令互動
 */
const handleInteraction = async (interaction) => {
  try {
    // 處理斜線命令
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
      return;
    }

    // 處理按鈕點擊
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
      return;
    }

    // 處理下拉選單選擇
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
      return;
    }

    // 處理表單提交
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
      return;
    }
  } catch (error) {
    console.error("❌ 處理互動時發生錯誤:", error);

    // 如果互動尚未回覆，則回覆錯誤訊息
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "處理請求時發生錯誤，請稍後再試。",
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: "處理請求時發生錯誤，請稍後再試。",
      });
    }
  }
};

/**
 * 處理斜線命令
 */
const handleSlashCommand = async (interaction) => {
  // 確認是否為 ocr 命令
  if (interaction.commandName === "ocr") {
    await interaction.deferReply(); // 延遲回覆，因為處理可能需要一些時間

    // 檢查是否有附加圖片
    const attachment = interaction.options.getAttachment("image");

    if (!attachment || !attachment.contentType.startsWith("image/")) {
      return interaction.editReply("請提供一張圖片！");
    }

    // 準備發送到 n8n 的資料
    const payload = {
      username: interaction.user.username,
      user_id: interaction.user.id,
      content: "Slash Command: /ocr",
      channel_id: interaction.channelId,
      timestamp: Date.now(),
      attachments: [
        {
          url: attachment.url,
          contentType: attachment.contentType,
          name: attachment.name,
          size: attachment.size,
        },
      ],
    };

    try {
      const response = await axios.post(
        `${process.env.N8N_URL}/ocrWebhook`,
        payload
      );

      if (response.data && response.data.reply) {
        await interaction.editReply(response.data.reply);
      } else {
        await interaction.editReply("圖片已成功處理！請稍候辨識結果(*’ｰ’*)");
      }
    } catch (error) {
      console.error("❌ 發送至 n8n 失敗:", error);
      await interaction.editReply("處理圖片時發生錯誤，請稍後再試。");
    }
  }
};

/**
 * 處理選擇分類後的流程
 */
const handleCategorySelection = async (
  interaction,
  selectedCategory,
  invoiceNumber,
  fields,
  imageUrl
) => {
  const rawDate = fields[1].value.replace(/`/g, "");
  const amount = fields[2].value.replace(/`NT\$ /g, "").replace(/`/g, "");

  // 格式化日期
  const date = formatDate(rawDate);

  // 儲存分類資訊到 Map
  if (!invoiceDataStore.has(invoiceNumber)) {
    invoiceDataStore.set(invoiceNumber, {});
  }

  const invoiceData = invoiceDataStore.get(invoiceNumber);
  invoiceData.invoiceNumber = invoiceNumber;
  invoiceData.date = date;
  invoiceData.amount = amount;
  invoiceData.imageUrl = imageUrl;
  invoiceData.category = selectedCategory;
  invoiceData.userId = interaction.user.id;

  // 檢查是否已有明細資料
  if (invoiceData.detail) {
    // 顯示確認訊息
    await showConfirmationMessage(interaction, invoiceNumber);
    return;
  }

  // 如果還沒有明細資料，回覆使用者
  await interaction.reply({
    content: `✅ 已選擇分類：${getCategoryLabel(
      selectedCategory
    )}，請添加明細內容！`,
    flags: MessageFlags.Ephemeral,
  });
};

/**
 * 處理下拉選單選擇
 */
const handleSelectMenuInteraction = async (interaction) => {
  const { customId, values } = interaction;

  // 處理分類選擇
  if (customId.startsWith("category_select_")) {
    const selectedCategory = values[0];
    const invoiceNumber = customId.replace("category_select_", "");

    // 獲取原始訊息
    const originalMessage = interaction.message;
    const originalEmbed = originalMessage.embeds[0];

    // 從 Embed 中提取資料
    const fields = originalEmbed.fields;
    const imageUrl = originalEmbed.thumbnail.url;

    await handleCategorySelection(
      interaction,
      selectedCategory,
      invoiceNumber,
      fields,
      imageUrl
    );
  }
};

/**
 * 處理表單提交
 */
const handleModalSubmit = async (interaction) => {
  const { customId } = interaction;

  // 處理發票編輯表單
  if (customId.startsWith("edit_invoice_modal_")) {
    const invoiceNumber = customId.replace("edit_invoice_modal_", "");

    // 獲取表單中的值
    const newInvoiceNumber =
      interaction.fields.getTextInputValue("invoice_number");
    const inputDate = interaction.fields.getTextInputValue("date");
    const newAmount = interaction.fields.getTextInputValue("amount");

    // 格式化日期
    const newDate = formatDate(inputDate);

    // 獲取原始訊息
    const originalMessage = interaction.message;
    const originalEmbed = originalMessage.embeds[0];

    // 創建新的 Embed
    const newEmbed = createInvoiceEmbed(
      {
        invoiceNumber: newInvoiceNumber,
        date: newDate,
        amount: newAmount,
        imageUrl: originalEmbed.thumbnail.url,
      },
      interaction.client
    );

    // 更新訊息
    await originalMessage.edit({
      embeds: [newEmbed],
      components: originalMessage.components,
    });

    // 如果有儲存過這個發票的資料，更新資料
    if (invoiceDataStore.has(invoiceNumber)) {
      // 如果發票號碼變更，需要重新儲存到新的鍵值
      const invoiceData = invoiceDataStore.get(invoiceNumber);
      invoiceDataStore.delete(invoiceNumber);

      invoiceData.invoiceNumber = newInvoiceNumber;
      invoiceData.date = newDate;
      invoiceData.amount = newAmount;

      invoiceDataStore.set(newInvoiceNumber, invoiceData);
    }

    // 回覆使用者
    await interaction.reply({
      content: "✅ 發票資訊已更新！",
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  // 處理明細內容表單
  if (customId.startsWith("details_modal_")) {
    const invoiceNumber = customId.replace("details_modal_", "");

    // 獲取表單中的值
    const detailContent =
      interaction.fields.getTextInputValue("detail_content");

    // 檢查是否有這個發票的資料
    if (!invoiceDataStore.has(invoiceNumber)) {
      // 如果還沒有資料，創建新的資料物件
      invoiceDataStore.set(invoiceNumber, {
        invoiceNumber,
        detail: detailContent,
        userId: interaction.user.id,
      });

      // 回覆使用者
      await interaction.reply({
        content: "✅ 明細已添加，請選擇消費分類！",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 如果已有資料，更新明細
    const invoiceData = invoiceDataStore.get(invoiceNumber);
    invoiceData.detail = detailContent;

    // 如果已有分類資料，顯示確認訊息
    if (invoiceData.category) {
      await showConfirmationMessage(interaction, invoiceNumber);
      return;
    }

    // 如果還沒有分類資料，回覆使用者
    await interaction.reply({
      content: "✅ 明細已添加，請選擇消費分類！",
      flags: MessageFlags.Ephemeral,
    });
  }
};

/**
 * 顯示確認訊息
 */
const showConfirmationMessage = async (interaction, invoiceNumber) => {
  const invoiceData = invoiceDataStore.get(invoiceNumber);
  const categoryLabel = getCategoryLabel(invoiceData.category);
  const username = await getUserName(interaction.client, invoiceData.userId);

  // 將用戶名稱添加到資料中
  invoiceData.username = username;

  // 創建確認 Embed
  const confirmEmbed = createConfirmationEmbed(invoiceData, getCategoryLabel);

  // 創建確認和取消按鈕
  const confirmButton = new ButtonBuilder()
    .setCustomId(`confirm_invoice_${invoiceNumber}`)
    .setLabel("確認並儲存")
    .setStyle(ButtonStyle.Success);

  const cancelButton = new ButtonBuilder()
    .setCustomId(`cancel_invoice_${invoiceNumber}`)
    .setLabel("取消")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

  // 發送確認訊息
  await interaction.reply({
    embeds: [confirmEmbed],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
};

/**
 * 處理按鈕點擊
 */
const handleButtonInteraction = async (interaction) => {
  const { customId } = interaction;

  // 處理修改發票資訊按鈕
  if (customId.startsWith("edit_invoice_")) {
    const invoiceNumber = customId.replace("edit_invoice_", "");

    // 獲取原始訊息中的 Embed 資料
    const originalEmbed = interaction.message.embeds[0];

    // 從 Embed 中提取資料
    const fields = originalEmbed.fields;
    const currentInvoiceNumber = fields[0].value.replace(/`/g, "");
    const currentDate = fields[1].value.replace(/`/g, "");
    const currentAmount = fields[2].value
      .replace(/`NT\$ /g, "")
      .replace(/`/g, "");

    // 創建並顯示編輯表單
    const modal = createEditInvoiceModal(
      currentInvoiceNumber,
      currentDate,
      currentAmount
    );
    await interaction.showModal(modal);
    return;
  }

  // 處理新增明細內容按鈕
  if (customId.startsWith("add_details_")) {
    const invoiceNumber = customId.replace("add_details_", "");

    // 創建並顯示明細表單
    const modal = createDetailsModal(invoiceNumber);
    await interaction.showModal(modal);
    return;
  }

  // 處理確認儲存按鈕
  if (customId.startsWith("confirm_invoice_")) {
    const invoiceNumber = customId.replace("confirm_invoice_", "");
    await interaction.update({
      content: "⏳ 正在處理中...",
      embeds: [],
      components: [],
    });
    await sendDataToN8n(interaction, invoiceNumber);
    return;
  }

  // 處理取消儲存按鈕
  if (customId.startsWith("cancel_invoice_")) {
    const invoiceNumber = customId.replace("cancel_invoice_", "");
    // 不刪除資料，讓使用者可以修改後重新確認
    await interaction.update({
      content: "❌ 已取消記帳。您可以修改資料後重新選擇分類或添加明細。",
      embeds: [],
      components: [],
    });
    return;
  }
};

/**
 * 將完整的發票資料發送到 n8n
 */
const sendDataToN8n = async (interaction, invoiceNumber) => {
  try {
    // 獲取發票資料
    const invoiceData = invoiceDataStore.get(invoiceNumber);

    // 添加互動 ID，以便 n8n 可以回傳通知
    invoiceData.interactionId = interaction.id;
    invoiceData.channelId = interaction.channelId;

    // 是否啟用 webhook 回調
    const enableWebhookCallbacks =
      process.env.ENABLE_WEBHOOK_CALLBACKS === "true";

    // 先更新訊息，告知使用者正在處理
    const processingMessage = `⏳ 資訊儲存中，請稍候...
📄 發票號碼：${invoiceData.invoiceNumber}
📅 日期：${invoiceData.date}
💰 金額：NT$ ${invoiceData.amount}
🏷️ 分類：${getCategoryLabel(invoiceData.category)}
📝 明細：${invoiceData.detail}

資料已送出，正在等待系統處理結果...`;

    await (interaction.editReply
      ? interaction.editReply({ content: processingMessage })
      : interaction.update({ content: processingMessage }));

    // 在公開頻道發送處理中訊息
    try {
      const publicProcessingEmbed = createProcessingEmbed(
        invoiceData,
        getCategoryLabel
      );

      // 給公開頻道發送處理中訊息
      const channel = interaction.channel;
      await channel.send({
        embeds: [publicProcessingEmbed],
      });
    } catch (error) {
      console.error("無法在公開頻道發送處理中訊息:", error);
    }

    // 發送到 n8n
    const result = await saveInvoiceData(invoiceData);

    // 刪除暫存資料
    invoiceDataStore.delete(invoiceNumber);

    // 如果啟用了 webhook 回調，就不在這裡顯示最終結果
    // 而是等待 n8n 透過 webhook 通知
    if (enableWebhookCallbacks) {
      return;
    }

    // 如果未啟用 webhook 回調，則直接顯示結果
    // 檢查 n8n 回傳的結果
    const isWarning = result.warning === true;
    const isSuccess = !result.error && !isWarning;
    const resultMessage =
      result.message ||
      (isSuccess
        ? "謝謝您使用發票記帳機器人！"
        : "記帳時發生問題，請聯絡管理員。");
    const statusEmoji = isSuccess ? "✅" : isWarning ? "⚠️" : "❌";

    // 生成回覆訊息
    const categoryLabel = getCategoryLabel(invoiceData.category);
    const finalContent = `${statusEmoji} ${
      isSuccess ? "記帳成功！" : isWarning ? "記帳警告：" : "記帳失敗："
    }
📄 發票號碼：${invoiceData.invoiceNumber}
📅 日期：${invoiceData.date}
💰 金額：NT$ ${invoiceData.amount}
🏷️ 分類：${categoryLabel}
📝 明細：${invoiceData.detail}

${resultMessage}`;

    // 更新互動訊息，顯示最終結果
    await (interaction.editReply
      ? interaction.editReply({ content: finalContent })
      : interaction.update({ content: finalContent }));
  } catch (error) {
    console.error("❌ 發送資料至 n8n 失敗:", error);
    await (interaction.editReply
      ? interaction.editReply({
          content: "❌ 儲存記帳資料時發生錯誤，請稍後再試。",
        })
      : interaction.update({
          content: "❌ 儲存記帳資料時發生錯誤，請稍後再試。",
        }));
  }
};

export const event = {
  name: Events.InteractionCreate,
  once: false,
  execute: handleInteraction,
};
