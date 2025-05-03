import textController from "./textController.js";
import stickerController from "./stickerController.js";
import imageController from "./imageController.js";
import invoiceController from "./invoiceController.js";

/**
 * 消息控制器
 * 整合所有訊息類型的處理邏輯，各自的實現細節在對應的子控制器中
 */

/**
 * 處理文字訊息
 */
const handleTextMessage = async (event) => {
  try {
    // 先檢查是否是處於編輯發票模式
    const isEditMode = await invoiceController.handleTextInput(event);

    // 如果已處於編輯模式，則不進行其他處理
    if (isEditMode) {
      return;
    }

    // 否則，交由原本的文字處理器處理
    await textController.handleTextMessage(event);
  } catch (error) {
    console.error("處理文字訊息失敗:", error);
  }
};

export default {
  // 自定義的文字訊息處理函數
  handleTextMessage,

  // 從貼圖控制器導出的函數
  handleStickerMessage: stickerController.handleStickerMessage,

  // 從圖片控制器導出的函數
  handleImageMessage: imageController.handleImageMessage,

  // 從發票控制器導出的函數
  replyOcrResultToLine: invoiceController.replyOcrResultToLine,
};
