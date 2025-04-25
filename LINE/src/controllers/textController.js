import lineService from "../services/lineService.js";

/**
 * 處理默認文字回應
 */
const handleDefaultMessage = async (replyToken) => {
  try {
    const messages = [
      { type: "text", text: "我詞窮了🥹" },
      { type: "text", text: "試試傳送 /cat 或是 /dog 看看吧٩(๑•̀ω•́๑)۶" },
    ];
    await lineService.replyMessage(replyToken, messages);
  } catch (error) {
    console.error("處理預設訊息時發生錯誤：", error);
  }
};

/**
 * 處理命令訊息
 */
const handleCommandMessage = async (command, replyToken) => {
  try {
    switch (command.toLowerCase()) {
      case "/cat":
        await lineService.replyMessage(replyToken, [
          { type: "text", text: "喵喵/ᐠ .ᆺ. ᐟﾉ" },
        ]);
        return true;
      case "/dog":
        await lineService.replyMessage(replyToken, [
          { type: "text", text: "汪汪Ꮚ･ꈊ･Ꮚ" },
        ]);
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error("處理命令訊息時發生錯誤：", error);
    return false;
  }
};

/**
 * 處理文字訊息
 */
const handleTextMessage = async (event) => {
  try {
    const userMessage = event.message.text;

    // 先嘗試處理命令，如果不是命令再使用預設回應
    const isCommand = await handleCommandMessage(userMessage, event.replyToken);
    if (!isCommand) {
      await handleDefaultMessage(event.replyToken);
    }
  } catch (error) {
    console.error("處理文字訊息時發生錯誤：", error);
  }
};

export default {
  handleTextMessage,
  handleDefaultMessage,
  handleCommandMessage,
};
