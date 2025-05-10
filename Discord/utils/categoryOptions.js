import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

/**
 * 消費分類選項
 */
export const CATEGORIES = [
  { label: "🍜 餐飲", value: "food", description: "餐廳、外送、飲料等" },
  { label: "🚗 交通", value: "transport", description: "計程車、公車、加油等" },
  { label: "🏠 日用品", value: "daily", description: "生活用品、清潔用品等" },
  { label: "🛒 購物", value: "shopping", description: "衣服、電子產品等" },
  { label: "💊 醫療", value: "medical", description: "醫院、藥局等" },
  { label: "📚 教育", value: "education", description: "書籍、課程、文具等" },
  { label: "🎮 娛樂", value: "entertainment", description: "電影、遊戲等" },
  { label: "📱 通訊", value: "communication", description: "電話費、網路費等" },
  { label: "⚡ 水電", value: "utilities", description: "水費、電費、瓦斯費等" },
  { label: "🏦 其他", value: "others", description: "無法歸類的項目" },
];

/**
 * 創建分類選單
 * @param {string} customIdPrefix - 自訂 ID 前綴
 * @param {string} identifier - 識別符（如發票號碼）
 * @returns {ActionRowBuilder} 包含選單的 ActionRow
 */
export const createCategorySelectMenu = (customIdPrefix, identifier) => {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`${customIdPrefix}_${identifier}`)
    .setPlaceholder("請選擇消費分類")
    .addOptions(CATEGORIES);

  return new ActionRowBuilder().addComponents(selectMenu);
};

/**
 * 創建操作按鈕
 * @param {string} invoiceNumber - 發票號碼
 * @returns {ActionRowBuilder} 包含按鈕的 ActionRow
 */
export const createActionButtons = (invoiceNumber) => {
  const editButton = new ButtonBuilder()
    .setCustomId(`edit_invoice_${invoiceNumber}`)
    .setLabel("修改發票資訊")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("✏️");

  const addDetailsButton = new ButtonBuilder()
    .setCustomId(`add_details_${invoiceNumber}`)
    .setLabel("新增明細內容")
    .setStyle(ButtonStyle.Success)
    .setEmoji("📝");

  return new ActionRowBuilder().addComponents(editButton, addDetailsButton);
};

/**
 * 創建發票編輯表單
 * @param {string} invoiceNumber - 發票號碼
 * @param {string} date - 日期
 * @param {string} amount - 金額
 * @returns {ModalBuilder} 表單
 */
export const createEditInvoiceModal = (invoiceNumber, date, amount) => {
  const modal = new ModalBuilder()
    .setCustomId(`edit_invoice_modal_${invoiceNumber}`)
    .setTitle("修改發票資訊");

  // 發票號碼輸入框
  const invoiceNumberInput = new TextInputBuilder()
    .setCustomId("invoice_number")
    .setLabel("發票號碼")
    .setStyle(TextInputStyle.Short)
    .setValue(invoiceNumber)
    .setRequired(true);

  // 日期輸入框
  const dateInput = new TextInputBuilder()
    .setCustomId("date")
    .setLabel("消費日期")
    .setStyle(TextInputStyle.Short)
    .setValue(date)
    .setRequired(true);

  // 金額輸入框
  const amountInput = new TextInputBuilder()
    .setCustomId("amount")
    .setLabel("消費金額")
    .setStyle(TextInputStyle.Short)
    .setValue(amount)
    .setRequired(true);

  // 將輸入框添加到 ActionRow
  const firstRow = new ActionRowBuilder().addComponents(invoiceNumberInput);
  const secondRow = new ActionRowBuilder().addComponents(dateInput);
  const thirdRow = new ActionRowBuilder().addComponents(amountInput);

  // 將 ActionRow 添加到表單
  modal.addComponents(firstRow, secondRow, thirdRow);

  return modal;
};

/**
 * 創建明細內容表單
 * @param {string} invoiceNumber - 發票號碼
 * @returns {ModalBuilder} 表單
 */
export const createDetailsModal = (invoiceNumber) => {
  const modal = new ModalBuilder()
    .setCustomId(`details_modal_${invoiceNumber}`)
    .setTitle("新增明細內容");

  // 明細名稱輸入框
  const detailInput = new TextInputBuilder()
    .setCustomId("detail_content")
    .setLabel("消費明細")
    .setPlaceholder("請輸入消費明細內容")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  // 將輸入框添加到 ActionRow
  const row = new ActionRowBuilder().addComponents(detailInput);

  // 將 ActionRow 添加到表單
  modal.addComponents(row);

  return modal;
};
