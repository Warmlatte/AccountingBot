import lineService from "../services/lineService.js";
import textController from "./textController.js";

/**
 * 處理貼圖訊息
 */
const handleStickerMessage = async (event) => {
  try {
    // 目前貼圖訊息使用與文字相同的默認回應
    await textController.handleDefaultMessage(event.replyToken);
  } catch (error) {
    console.error("處理貼圖訊息時發生錯誤：", error);
  }
};

export default {
  handleStickerMessage,
};
