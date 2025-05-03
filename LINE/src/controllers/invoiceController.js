import lineService from "../services/lineService.js";
import config from "../config/index.js";

/**
 * 格式化日期字串
 * @param {string} dateStr - 輸入的日期字串，可能為純數字 (例如: 20230101) 或已格式化的日期 (例如: 2023-01-01)
 * @returns {string} 格式化後的日期字串 (格式: YYYY-MM-DD)
 */
const formatDateString = (dateStr) => {
  if (!dateStr) return "";

  // 移除所有非數字字符
  const digits = dateStr.replace(/\D/g, "");

  // 檢查數字長度是否符合年月日格式 (至少需要8位數字)
  if (digits.length < 8) return dateStr;

  // 提取年、月、日
  const year = digits.substring(0, 4);
  const month = digits.substring(4, 6);
  const day = digits.substring(6, 8);

  // 驗證年、月、日的值是否合理
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (
    yearNum < 1900 ||
    yearNum > 2100 ||
    monthNum < 1 ||
    monthNum > 12 ||
    dayNum < 1 ||
    dayNum > 31
  ) {
    return dateStr; // 不合理的日期，返回原值
  }

  // 返回格式化的日期 (YYYY-MM-DD)
  return `${year}-${month}-${day}`;
};

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
    value === "undefined" ||
    value === ""
  ) {
    return defaultValue;
  }

  // 確保值是字串類型
  let strValue = String(value);

  // 檢查是否只包含無意義字符（如空格、連字符）
  if (/^[\s\-]+$/.test(strValue)) {
    return defaultValue;
  }

  // 檢查是否為日期格式的數字字串，如果是則格式化
  if (/^\d{8,}$/.test(strValue) && strValue.length <= 10) {
    // 可能是未格式化的日期，嘗試格式化
    const formattedDate = formatDateString(strValue);
    if (formattedDate !== strValue) {
      return formattedDate;
    }
  }

  // 其他情況，返回去除前後空格的值
  return strValue.trim();
};

/**
 * 建立Flex Message用於確認發票資訊
 */
const createInvoiceFlexMessage = (imageUrl, invoiceNumber, date, amount) => {
  // 清理資料
  const safeInvoiceNumber = cleanValue(invoiceNumber);
  const safeDate = cleanValue(date);
  const safeAmount = cleanValue(amount);
  const safeImageUrl = cleanValue(imageUrl);

  // 定義顯示文本，只有當值為空字串時才顯示"未識別"
  const displayInvoiceNumber = safeInvoiceNumber || "未識別";
  const displayDate = safeDate || "未識別";
  const displayAmount = safeAmount ? `${safeAmount} 元` : "未識別";

  return {
    type: "flex",
    altText: "請確認您的發票資訊",
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: "https://i.pinimg.com/736x/0b/1b/8d/0b1b8d1fb3539f5ceaf3e94e06be12f7.jpg",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "請確認以下資訊",
            weight: "bold",
            size: "lg",
            margin: "md",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "發票號碼：",
                flex: 3,
                size: "sm",
              },
              {
                type: "text",
                text: displayInvoiceNumber,
                flex: 5,
                size: "sm",
                wrap: true,
              },
              {
                type: "button",
                style: "link",
                height: "sm",
                action: {
                  type: "postback",
                  label: "修改",
                  data: `action=edit&field=inv&value=${safeInvoiceNumber}&date=${safeDate}&amount=${safeAmount}&imageUrl=${encodeURIComponent(
                    safeImageUrl || ""
                  )}`,
                  displayText: "修改發票號碼",
                },
                flex: 2,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "日期：",
                flex: 3,
                size: "sm",
              },
              {
                type: "text",
                text: displayDate,
                flex: 5,
                size: "sm",
                wrap: true,
              },
              {
                type: "button",
                style: "link",
                height: "sm",
                action: {
                  type: "postback",
                  label: "修改",
                  data: `action=edit&field=date&value=${safeDate}&inv=${safeInvoiceNumber}&amount=${safeAmount}&imageUrl=${encodeURIComponent(
                    safeImageUrl || ""
                  )}`,
                  displayText: "修改日期",
                },
                flex: 2,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "金額：",
                flex: 3,
                size: "sm",
              },
              {
                type: "text",
                text: displayAmount,
                flex: 5,
                size: "sm",
                wrap: true,
              },
              {
                type: "button",
                style: "link",
                height: "sm",
                action: {
                  type: "postback",
                  label: "修改",
                  data: `action=edit&field=amount&value=${safeAmount}&inv=${safeInvoiceNumber}&date=${safeDate}&imageUrl=${encodeURIComponent(
                    safeImageUrl || ""
                  )}`,
                  displayText: "修改金額",
                },
                flex: 2,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "postback",
              label: "選擇分類",
              data: `action=classify&inv=${safeInvoiceNumber}&date=${safeDate}&amount=${safeAmount}&imageUrl=${encodeURIComponent(
                safeImageUrl || ""
              )}`,
            },
            color: "#27ACB2",
          },
        ],
      },
    },
  };
};

/**
 * 回傳辨識結果給用戶
 */
const replyOcrResultToLine = async ({
  userId,
  invoiceNumber,
  date,
  amount,
  imageUrl,
}) => {
  try {
    // 清理資料
    const safeInvoiceNumber = cleanValue(invoiceNumber);
    const safeDate = cleanValue(date);
    const safeAmount = cleanValue(amount);

    const flexMessage = createInvoiceFlexMessage(
      imageUrl,
      safeInvoiceNumber,
      safeDate,
      safeAmount
    );

    // 檢查用戶ID
    if (!userId) {
      console.error("用戶ID為空，無法發送訊息");
      return;
    }

    await lineService.pushMessage(userId, flexMessage);
  } catch (error) {
    console.error("發送 Flex Message 失敗:", error);

    // 嘗試發送簡單訊息作為備用
    try {
      if (userId) {
        await lineService.pushMessage(userId, {
          type: "text",
          text: "很抱歉，無法顯示發票確認界面，請稍後再試。",
        });
      }
    } catch (backupError) {
      console.error("發送備用訊息也失敗:", backupError);
    }

    throw error;
  }
};

/**
 * 預設分類選項
 */
const CATEGORY_OPTIONS = [
  { label: "餐飲", value: "餐飲" },
  { label: "交通", value: "交通" },
  { label: "日用品", value: "日用品" },
  { label: "娛樂", value: "娛樂" },
  { label: "醫療", value: "醫療" },
  { label: "教育學習", value: "教育學習" },
  { label: "通訊", value: "通訊" },
  { label: "房租房貸", value: "房租房貸" },
  { label: "保險", value: "保險" },
  { label: "寵物", value: "寵物" },
  { label: "旅遊", value: "旅遊" },
  { label: "其他", value: "其他" },
];

/**
 * 建立分類選擇的Flex Message
 */
const createCategoryFlexMessage = (invoiceNumber, date, amount, imageUrl) => {
  // 清理資料
  const safeInvoiceNumber = cleanValue(invoiceNumber);
  const safeDate = cleanValue(date);
  const safeAmount = cleanValue(amount);
  const safeImageUrl = cleanValue(imageUrl);

  // 顯示文本
  const displayAmount = safeAmount ? `${safeAmount} 元` : "未填寫";

  // 預設分類選項
  const categories = CATEGORY_OPTIONS;

  return {
    type: "flex",
    altText: "請選擇消費分類",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "請選擇消費分類",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: `金額：${displayAmount}`,
            size: "sm",
            color: "#888888",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: categories.map((category) => ({
              type: "button",
              action: {
                type: "postback",
                label: category.label,
                data: `action=save&category=${
                  category.value
                }&inv=${safeInvoiceNumber}&date=${safeDate}&amount=${safeAmount}&imageUrl=${encodeURIComponent(
                  safeImageUrl || ""
                )}`,
                displayText: `選擇分類：${category.label}`,
              },
              height: "sm",
              style: "link",
              color: "#27ACB2",
            })),
          },
        ],
      },
    },
  };
};

/**
 * 發送分類選擇訊息給用戶
 */
const sendCategorySelection = async (
  userId,
  invoiceNumber,
  date,
  amount,
  imageUrl
) => {
  try {
    const flexMessage = createCategoryFlexMessage(
      invoiceNumber,
      date,
      amount,
      imageUrl
    );
    await lineService.pushMessage(userId, flexMessage);
  } catch (error) {
    console.error("發送分類選擇訊息失敗:", error);
    throw error;
  }
};

/**
 * 發送發票資料到 n8n
 */
const sendInvoiceDataToN8n = async (
  userId,
  invoiceNumber,
  date,
  amount,
  category,
  imageUrl
) => {
  try {
    // 清理資料
    const safeInvoiceNumber = cleanValue(invoiceNumber);
    const safeDate = cleanValue(date);
    const safeAmount = cleanValue(amount);
    const safeCategory = cleanValue(category, "未分類");
    const safeImageUrl = cleanValue(imageUrl);

    // 獲取用戶資料以取得displayName
    let userDisplayName = "未知用戶";
    try {
      const userProfile = await lineService.getUserProfile(userId);
      userDisplayName = userProfile.displayName || "未知用戶";
    } catch (profileError) {
      console.error("獲取用戶資料失敗，使用預設名稱:", profileError);
    }

    // 準備要傳送給 n8n 的資料
    const data = {
      user_id: userId,
      displayName: userDisplayName,
      platform: "line",
      invoiceNumber: safeInvoiceNumber,
      date: safeDate,
      amount: safeAmount,
      category: safeCategory,
      imageUrl: safeImageUrl,
    };

    // 從配置中獲取 n8n Save Webhook 端點
    const n8nSaveWebhook = config.n8nSaveWebhook;

    // 檢查 n8n Save Webhook 端點是否設置
    if (!n8nSaveWebhook) {
      throw new Error("未設置 N8N_ENDPOINT 環境變數或 n8nSaveWebhook 未配置");
    }

    // 發送到 n8n 的 saveWebhook 端點
    const response = await fetch(n8nSaveWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch((e) => "無法獲取錯誤詳情");
      console.error(`n8n回應錯誤 (${response.status}): ${errorText}`);
      throw new Error(`傳送資料到 n8n 失敗: ${response.status}`);
    }

    const responseData = await response.json().catch((e) => {
      return { success: true, message: "操作完成" };
    });

    return responseData;
  } catch (error) {
    console.error("傳送發票資料到 n8n 失敗:", error);
    throw error;
  }
};

/**
 * 回傳記帳成功訊息
 */
const sendSuccessMessage = async (
  userId,
  category,
  amount,
  date,
  imageUrl,
  displayName = ""
) => {
  try {
    const cleanCategory = cleanValue(category, "未分類");
    const cleanAmount = cleanValue(amount, "未填寫");
    const cleanDate = cleanValue(date, "未填寫");

    // 如果沒有提供displayName，嘗試獲取用戶名稱
    let userDisplayName = displayName;
    if (!userDisplayName) {
      try {
        const userProfile = await lineService.getUserProfile(userId);
        userDisplayName = userProfile.displayName;
      } catch (error) {
        console.error("獲取用戶名稱失敗，繼續處理:", error);
      }
    }

    // 建立用於成功訊息的Flex Message
    const flexMessage = {
      type: "flex",
      altText: "記帳成功",
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://i.pinimg.com/736x/5d/0f/fa/5d0ffaa681ad915b049b642ddf7c3b65.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          backgroundColor: "#F7F8FB",
          contents: [
            {
              type: "text",
              text: "✅ 記帳成功",
              weight: "bold",
              size: "xxl",
              color: "#27ACB2",
              align: "center",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "👤",
                      size: "md",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: userDisplayName ? userDisplayName : "使用者",
                      weight: "bold",
                      size: "md",
                      flex: 5,
                      wrap: true,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "🏷️",
                      size: "md",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: cleanCategory,
                      weight: "bold",
                      size: "md",
                      flex: 5,
                      color: "#27ACB2",
                      wrap: true,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "💰",
                      size: "md",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: `${cleanAmount} 元`,
                      weight: "bold",
                      size: "md",
                      flex: 5,
                      color: "#111111",
                      wrap: true,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "📅",
                      size: "md",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: cleanDate,
                      weight: "bold",
                      size: "md",
                      flex: 5,
                      color: "#111111",
                      wrap: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        styles: {
          body: {
            backgroundColor: "#F7F8FB",
          },
          footer: {
            separator: true,
          },
        },
      },
    };

    // 如果有圖片URL，添加跳轉按鈕
    if (imageUrl && imageUrl !== "null" && imageUrl !== "undefined") {
      flexMessage.contents.footer = {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        backgroundColor: "#F7F8FB",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "查看發票圖片",
              uri: imageUrl,
            },
            color: "#27ACB2",
            height: "sm",
          },
        ],
      };
    }

    // 發送Flex Message
    await lineService.pushMessage(userId, flexMessage);
  } catch (error) {
    console.error("發送成功訊息失敗:", error);
    throw error;
  }
};

/**
 * 建立輸入表單Flex Message
 */
const createInputFormMessage = (
  field,
  currentValue,
  invoiceNumber,
  date,
  amount
) => {
  // 根據欄位類型設置標題和提示
  let title = "";
  let placeholder = "";
  let helpText = "";

  switch (field) {
    case "inv":
      title = "修改發票號碼";
      placeholder = "請輸入正確的發票號碼";
      break;
    case "date":
      title = "修改日期";
      placeholder = "請直接輸入數字，例如: 20230131";
      helpText = "只需輸入8位數字，系統會自動格式化為 YYYY-MM-DD";
      break;
    case "amount":
      title = "修改金額";
      placeholder = "請輸入正確的金額";
      break;
    default:
      title = "修改資料";
      placeholder = "請輸入正確的資料";
  }

  // 建構內容區塊
  const contents = [
    {
      type: "text",
      text: title,
      weight: "bold",
      size: "lg",
    },
    {
      type: "separator",
      margin: "md",
    },
    {
      type: "text",
      text: "請在聊天視窗中輸入新的資料",
      margin: "md",
      size: "sm",
      color: "#888888",
    },
    {
      type: "text",
      text: `目前值: ${currentValue || "未設定"}`,
      margin: "sm",
      size: "sm",
    },
    {
      type: "text",
      text: placeholder,
      margin: "md",
      size: "sm",
      color: "#27ACB2",
    },
  ];

  // 如果有幫助文字，添加到內容中
  if (helpText) {
    contents.push({
      type: "text",
      text: helpText,
      margin: "sm",
      size: "xs",
      color: "#888888",
      wrap: true,
    });
  }

  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: contents,
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "postback",
              label: "取消修改",
              data: `action=cancel`,
              displayText: "取消修改",
            },
            color: "#aaaaaa",
          },
        ],
      },
    },
  };
};

/**
 * 處理編輯模式
 */
const handleEditMode = async (
  userId,
  field,
  value,
  invoiceNumber,
  date,
  amount,
  imageUrl = ""
) => {
  try {
    // 獲取當前編輯欄位的實際值
    let originalValue = value;

    // 確保原始值不是 undefined 或 null 等無效值
    if (
      !originalValue ||
      originalValue === "null" ||
      originalValue === "undefined"
    ) {
      // 如果沒有原始值，則根據欄位類型分配當前值
      switch (field) {
        case "inv":
          originalValue = invoiceNumber || "";
          break;
        case "date":
          originalValue = date || "";
          break;
        case "amount":
          originalValue = amount || "";
          break;
        default:
          originalValue = "";
      }
    }

    // 儲存用戶的編輯狀態，同時保留原始值以便取消時恢復
    userEditState[userId] = {
      field,
      invoiceNumber: invoiceNumber || "",
      date: date || "",
      amount: amount || "",
      imageUrl: imageUrl || "",
      // 儲存原始值
      originalValue,
    };

    // 發送編輯表單訊息
    const inputForm = createInputFormMessage(
      field,
      originalValue,
      invoiceNumber,
      date,
      amount
    );
    await lineService.pushMessage(userId, inputForm);

    // 發送提示訊息
    let promptMessage = {
      type: "text",
      text: "請直接在聊天視窗中輸入新的資料，輸入完成後系統將自動更新。",
    };

    // 如果是日期欄位，添加特殊提示
    if (field === "date") {
      promptMessage = {
        type: "text",
        text: "請直接輸入8位數字 (例如20230101)，系統會自動轉換成日期格式 (2023-01-01)。",
      };
    }

    await lineService.pushMessage(userId, promptMessage);
  } catch (error) {
    console.error("處理編輯模式失敗:", error);
    throw error;
  }
};

// 儲存用戶編輯狀態
const userEditState = {};

/**
 * 處理用戶的文字輸入
 */
const handleTextInput = async (event) => {
  const userId = event.source.userId;
  const text = event.message.text;

  // 檢查用戶是否處於編輯模式
  if (!userEditState[userId]) {
    return false; // 不處於編輯模式，返回false讓其他處理器處理
  }

  try {
    const { field, invoiceNumber, date, amount, imageUrl } =
      userEditState[userId];

    // 初始化更新後的值為當前值
    let updatedInvoiceNumber = invoiceNumber || "";
    let updatedDate = date || "";
    let updatedAmount = amount || "";
    let updatedImageUrl = imageUrl || "";

    // 根據欄位類型更新相應的值
    switch (field) {
      case "inv":
        updatedInvoiceNumber = text || ""; // 確保不是 undefined
        break;
      case "date":
        // 格式化日期輸入
        if (text) {
          // 檢查是否只包含數字
          if (/^\d+$/.test(text)) {
            // 使用日期格式化函數
            updatedDate = formatDateString(text);
          } else {
            // 已經包含格式化符號的日期，直接使用
            updatedDate = text;
          }
        } else {
          updatedDate = "";
        }
        break;
      case "amount":
        updatedAmount = text || ""; // 確保不是 undefined
        break;
    }

    // 清除編輯狀態
    delete userEditState[userId];

    // 發送更新後的確認訊息
    await replyOcrResultToLine({
      userId,
      invoiceNumber: updatedInvoiceNumber,
      date: updatedDate,
      amount: updatedAmount,
      imageUrl: updatedImageUrl,
    });

    // 通知用戶修改成功
    const confirmMessage = {
      type: "text",
      text: "✓ 資料已更新，請確認並選擇分類。",
    };
    await lineService.pushMessage(userId, confirmMessage);

    return true; // 已處理文字輸入
  } catch (error) {
    console.error("處理文字輸入失敗:", error);
    return false;
  }
};

/**
 * 處理 Postback 事件
 */
const handlePostback = async (event) => {
  try {
    // 確保正確獲取用戶ID
    const userId = event.source.userId;
    if (!userId) {
      console.error("未能獲取用戶ID:", event.source);
      return;
    }

    // 檢查postback資料是否存在
    if (!event.postback || !event.postback.data) {
      console.error("Postback事件缺少data屬性:", event);
      return;
    }

    const data = event.postback.data;

    const params = new URLSearchParams(data);
    const action = params.get("action");

    if (action === "classify") {
      // 處理 "選擇分類" 按鈕的點擊
      const invoiceNumber = cleanValue(params.get("inv"));
      const date = cleanValue(params.get("date"));
      const amount = cleanValue(params.get("amount"));
      const imageUrl = params.get("imageUrl")
        ? decodeURIComponent(params.get("imageUrl"))
        : "";

      // 發送分類選擇訊息
      await sendCategorySelection(
        userId,
        invoiceNumber,
        date,
        amount,
        imageUrl
      );
    } else if (action === "save") {
      // 處理分類選擇後的保存操作
      const invoiceNumber = cleanValue(params.get("inv"));
      const date = cleanValue(params.get("date"));
      const amount = cleanValue(params.get("amount"));
      const category = cleanValue(params.get("category"));
      const imageUrl = params.get("imageUrl")
        ? decodeURIComponent(params.get("imageUrl"))
        : "";

      try {
        // 向用戶發送處理中訊息
        await lineService.pushMessage(userId, {
          type: "text",
          text: "⏳ 正在儲存資料，請稍候...",
        });

        // 發送資料到 n8n
        await sendInvoiceDataToN8n(
          userId,
          invoiceNumber,
          date,
          amount,
          category,
          imageUrl
        );
      } catch (error) {
        console.error("資料發送失敗:", error);

        // 發送失敗訊息
        await lineService.pushMessage(userId, {
          type: "text",
          text: `❌ 儲存失敗，請稍後再試\n錯誤: ${error.message}`,
        });
      }
    } else if (action === "edit") {
      // 處理編輯請求
      const field = params.get("field");
      const value = cleanValue(params.get("value"));
      const invoiceNumber = cleanValue(params.get("inv"));
      const date = cleanValue(params.get("date"));
      const amount = cleanValue(params.get("amount"));
      const imageUrl = params.get("imageUrl")
        ? decodeURIComponent(params.get("imageUrl"))
        : "";

      // 進入編輯模式
      await handleEditMode(
        userId,
        field,
        value,
        invoiceNumber,
        date,
        amount,
        imageUrl
      );
    } else if (action === "cancel") {
      // 處理取消編輯
      // 檢查用戶是否處於編輯狀態
      if (!userEditState[userId]) {
        return;
      }

      // 從編輯狀態中取回資料
      const { invoiceNumber, date, amount, field, originalValue, imageUrl } =
        userEditState[userId];

      // 根據編輯欄位更新資料
      let updatedInvoiceNumber = invoiceNumber;
      let updatedDate = date;
      let updatedAmount = amount;

      // 根據欄位類型恢復原始值
      switch (field) {
        case "inv":
          updatedInvoiceNumber = originalValue || invoiceNumber;
          break;
        case "date":
          updatedDate = originalValue || date;
          break;
        case "amount":
          updatedAmount = originalValue || amount;
          break;
      }

      // 清除用戶編輯狀態
      delete userEditState[userId];

      // 重新顯示確認訊息，使用原始的值
      await replyOcrResultToLine({
        userId,
        invoiceNumber: updatedInvoiceNumber,
        date: updatedDate,
        amount: updatedAmount,
        imageUrl: imageUrl,
      });

      const cancelMessage = {
        type: "text",
        text: "已取消修改",
      };
      await lineService.pushMessage(userId, cancelMessage);
    } else {
      console.error(`未知的action類型: ${action}`);
    }
  } catch (error) {
    console.error("處理 Postback 事件失敗:", error);
    // 嘗試向用戶發送錯誤訊息
    try {
      if (event?.source?.userId) {
        await lineService.pushMessage(event.source.userId, {
          type: "text",
          text: "處理您的請求時發生錯誤，請稍後再試。",
        });
      }
    } catch (sendError) {
      console.error("無法發送錯誤訊息:", sendError);
    }
  }
};

/**
 * 發送發票重複記帳的通知訊息
 */
const sendInvoiceRepeatMessage = async (userId, invoiceNumber) => {
  try {
    const safeInvoiceNumber = cleanValue(invoiceNumber, "未知");

    // 建立Flex Message
    const flexMessage = {
      type: "flex",
      altText: "發票重複記帳提醒",
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://i.pinimg.com/736x/f8/e1/2f/f8e12f49f25ba46252187e6e8e464256.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⚠️ 發票已記帳過",
              weight: "bold",
              size: "xl",
              color: "#FF9800",
              align: "center",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: `此發票已經記帳過，系統已略過此次記帳操作以避免重複。`,
                  wrap: true,
                  size: "md",
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              action: {
                type: "uri",
                label: "查看記帳歷史",
                uri: "https://docs.google.com/spreadsheets/d/1ku-uJPyoQJtlMVjB9jLnRFMuANeTV5a2Ulx-YIzyXp0/edit?gid=0#gid=0", // LINE記帳系統首頁網址，需要依實際系統替換
              },
              color: "#FF9800",
              height: "sm",
            },
          ],
          flex: 0,
        },
        styles: {
          body: {
            backgroundColor: "#FFF9E5",
          },
          footer: {
            separator: true,
          },
        },
      },
    };

    await lineService.pushMessage(userId, flexMessage);
  } catch (error) {
    console.error("發送發票重複提醒失敗:", error);
    // 發送備用文字訊息
    try {
      await lineService.pushMessage(userId, {
        type: "text",
        text: "⚠️ 此發票已記帳過，請勿重複記帳。",
      });
    } catch (backupError) {
      console.error("發送備用訊息也失敗:", backupError);
    }
  }
};

export default {
  replyOcrResultToLine,
  createInvoiceFlexMessage,
  handlePostback,
  sendCategorySelection,
  sendInvoiceDataToN8n,
  sendSuccessMessage,
  handleTextInput,
  sendInvoiceRepeatMessage,
};
