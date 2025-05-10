import { EmbedBuilder } from "discord.js";
import {
  INVOICE_IMAGES,
  SUCCESS_IMAGES,
  WARNING_IMAGES,
  PROCESSING_IMAGES,
  CONFIRMATION_IMAGES,
  getRandomImage,
} from "./imageUrls.js";

/**
 * 根據金額獲取對應的顏色代碼
 * @param {string|number} amount - 金額
 * @returns {number} 十六進制顏色代碼
 */
export const getEmbedColor = (amount) => {
  // 確保 amount 是字串
  const amountStr = String(amount || "");

  // 嘗試轉換金額為數字
  const numAmount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));

  if (isNaN(numAmount)) return 0x0099ff; // 預設藍色

  if (numAmount >= 5000) return 0xff0000; // 紅色 - 高金額
  if (numAmount >= 1000) return 0xffa500; // 橘色 - 中高金額
  if (numAmount >= 500) return 0xffff00; // 黃色 - 中等金額
  if (numAmount >= 100) return 0x00ff00; // 綠色 - 低金額
  return 0x0099ff; // 藍色 - 極低金額
};

/**
 * 創建發票辨識結果的 Embed
 * @param {Object} data - 發票資料
 * @param {string} data.invoiceNumber - 發票號碼
 * @param {string} data.date - 日期
 * @param {string} data.amount - 金額
 * @param {string} data.imageUrl - 圖片 URL
 * @param {Object} client - Discord 客戶端
 * @returns {EmbedBuilder} 構建好的 Embed
 */
export const createInvoiceEmbed = (data, client) => {
  const { invoiceNumber, date, amount, imageUrl } = data;
  const INVOICE_IMAGE_URL = getRandomImage(INVOICE_IMAGES);

  return new EmbedBuilder()
    .setColor(getEmbedColor(amount))
    .setTitle("📝 發票辨識結果")
    .setDescription("請確認以下資訊並選擇分類")
    .addFields(
      { name: "📄 發票號碼", value: `\`${invoiceNumber}\``, inline: true },
      { name: "📅 消費日期", value: `\`${date}\``, inline: true },
      { name: "💰 消費金額", value: `\`NT$ ${amount}\``, inline: true }
    )
    .setThumbnail(imageUrl)
    .setImage(INVOICE_IMAGE_URL)
    .setTimestamp()
    .setFooter({
      text: "發票喵喵 💰",
      iconURL: client?.user?.displayAvatarURL(),
    });
};

/**
 * 創建記帳成功的 Embed
 * @param {Object} data - 記帳資料
 * @param {string} data.userId - 使用者 ID
 * @param {string} data.invoiceNumber - 發票號碼
 * @param {string} data.amount - 金額
 * @param {string} data.categoryLabel - 分類標籤
 * @param {string} data.imageUrl - 圖片 URL (選填)
 * @returns {EmbedBuilder} 構建好的 Embed
 */
export const createSuccessEmbed = (data) => {
  const { userId, invoiceNumber, amount, categoryLabel, imageUrl } = data;
  const SUCCESS_IMAGE_URL = getRandomImage(SUCCESS_IMAGES);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ 記帳成功")
    .setDescription(`<@${userId}> 的發票已成功記錄！`)
    .addFields(
      {
        name: "發票號碼",
        value: `${invoiceNumber || "未提供"}`,
        inline: true,
      },
      { name: "金額", value: `NT$ ${amount || "未提供"}`, inline: true },
      { name: "分類", value: `${categoryLabel || "未分類"}`, inline: true }
    )
    .setImage(SUCCESS_IMAGE_URL)
    .setTimestamp();

  if (imageUrl) {
    embed.setThumbnail(imageUrl);
    embed.addFields({
      name: "圖片連結",
      value: `[點擊查看圖片](${imageUrl})`,
      inline: false,
    });
  }

  return embed;
};

/**
 * 創建重複記帳警告的 Embed
 * @param {Object} data - 記帳資料
 * @param {string} data.userId - 使用者 ID
 * @param {string} data.invoiceNumber - 發票號碼
 * @returns {EmbedBuilder} 構建好的 Embed
 */
export const createDuplicateWarningEmbed = (data) => {
  const { userId, invoiceNumber } = data;
  const DUPLICATE_WARNING_IMAGE_URL = getRandomImage(WARNING_IMAGES);

  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("⚠️ 重複記帳警告")
    .setDescription(
      `<@${userId}>，您嘗試記錄的發票 (號碼: ${invoiceNumber}) 可能已經存在於系統中。`
    )
    .addFields(
      {
        name: "提醒",
        value:
          "請檢查您的記帳記錄，避免重複登錄，如為重複記帳，請至雲端刪除此次圖片檔",
      },
      {
        name: "協助",
        value: "如果您認為這是一筆新的消費，或需要協助，請聯絡管理員。",
      }
    )
    .setImage(DUPLICATE_WARNING_IMAGE_URL)
    .setFooter({ text: "請確認發票資訊，確保記帳準確。" })
    .setTimestamp();
};

/**
 * 創建資料處理中的 Embed
 * @param {Object} data - 記帳資料
 * @param {string} data.userId - 使用者 ID
 * @param {string} data.invoiceNumber - 發票號碼
 * @param {string} data.amount - 金額
 * @param {string} data.category - 分類
 * @param {string} data.imageUrl - 圖片 URL (選填)
 * @param {function} getCategoryLabel - 取得分類標籤的函數
 * @returns {EmbedBuilder} 構建好的 Embed
 */
export const createProcessingEmbed = (data, getCategoryLabel) => {
  const { userId, invoiceNumber, amount, category, imageUrl } = data;
  const PROCESSING_IMAGE_URL = getRandomImage(PROCESSING_IMAGES);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("⏳ 資料處理中")
    .setDescription(`<@${userId}> 的發票資料正在處理中...`)
    .addFields(
      {
        name: "發票號碼",
        value: `${invoiceNumber}`,
        inline: true,
      },
      { name: "金額", value: `NT$ ${amount}`, inline: true },
      {
        name: "分類",
        value: `${getCategoryLabel(category)}`,
        inline: true,
      }
    )
    .setImage(PROCESSING_IMAGE_URL)
    .setTimestamp();

  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  return embed;
};

/**
 * 創建記帳資料確認的 Embed
 * @param {Object} data - 記帳資料
 * @param {string} data.invoiceNumber - 發票號碼
 * @param {string} data.date - 日期
 * @param {string} data.amount - 金額
 * @param {string} data.category - 分類
 * @param {string} data.detail - 明細
 * @param {string} data.username - 使用者名稱
 * @param {string} data.imageUrl - 圖片 URL (選填)
 * @param {function} getCategoryLabel - 取得分類標籤的函數
 * @returns {EmbedBuilder} 構建好的 Embed
 */
export const createConfirmationEmbed = (data, getCategoryLabel) => {
  const { invoiceNumber, date, amount, category, detail, username, imageUrl } =
    data;

  const CONFIRMATION_IMAGE_URL = getRandomImage(CONFIRMATION_IMAGES);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("📝 記帳資料確認")
    .setDescription("請確認以下資料是否正確。確認後將儲存到記帳系統。")
    .addFields(
      { name: "📄 發票號碼", value: `\`${invoiceNumber}\`` },
      { name: "📅 日期", value: `\`${date}\`` },
      { name: "💰 金額", value: `\`NT$ ${amount}\`` },
      { name: "🏷️ 分類", value: `\`${getCategoryLabel(category)}\`` },
      { name: "📝 明細", value: `\`${detail}\`` },
      { name: "👤 使用者", value: `\`${username}\`` }
    )
    .setImage(CONFIRMATION_IMAGE_URL)
    .setTimestamp();

  if (imageUrl) {
    embed.setThumbnail(imageUrl);
  }

  return embed;
};
