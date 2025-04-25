import lineService from "../services/lineService.js";

/**
 * 建立Flex Message用於確認發票資訊
 */
const createInvoiceFlexMessage = (imageUrl, invoiceNumber, date, amount) => {
  // 使用預設圖片，如果沒有提供有效的圖片網址
  const displayImageUrl =
    "https://i.pinimg.com/736x/0b/1b/8d/0b1b8d1fb3539f5ceaf3e94e06be12f7.jpg";

  return {
    type: "flex",
    altText: "請確認您的發票資訊",
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: displayImageUrl,
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
            type: "text",
            text: `發票號碼：${invoiceNumber || "未識別"}`,
            margin: "md",
          },
          {
            type: "text",
            text: `日期：${date || "未識別"}`,
            margin: "sm",
          },
          {
            type: "text",
            text: `金額：${amount || "未識別"} 元`,
            margin: "sm",
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
              data: `action=classify&inv=${invoiceNumber}`,
            },
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
    console.log(`準備發送 Flex Message 給用戶 ${userId}`);
    const flexMessage = createInvoiceFlexMessage(
      imageUrl,
      invoiceNumber,
      date,
      amount
    );
    await lineService.pushMessage(userId, flexMessage);
    console.log("發送 Flex Message 成功");
  } catch (error) {
    console.error("發送 Flex Message 失敗:", error);
    throw error;
  }
};

export default {
  replyOcrResultToLine,
  createInvoiceFlexMessage,
};
