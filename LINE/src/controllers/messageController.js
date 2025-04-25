import textController from "./textController.js";
import stickerController from "./stickerController.js";
import imageController from "./imageController.js";
import invoiceController from "./invoiceController.js";

/**
 * 消息控制器
 * 整合所有訊息類型的處理邏輯，各自的實現細節在對應的子控制器中
 */

export default {
  // 從文字控制器導出的函數
  handleTextMessage: textController.handleTextMessage,

  // 從貼圖控制器導出的函數
  handleStickerMessage: stickerController.handleStickerMessage,

  // 從圖片控制器導出的函數
  handleImageMessage: imageController.handleImageMessage,

  // 從發票控制器導出的函數
  replyOcrResultToLine: invoiceController.replyOcrResultToLine,
};
