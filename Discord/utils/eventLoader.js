import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 儲存事件處理器
const eventHandlers = new Map();

// 獲取目前檔案的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 載入所有事件模組
 * @param {Client} client Discord 客戶端
 */
export const loadEvents = async (client) => {
  const eventsPath = path.join(__dirname, "..", "events");

  try {
    // 確認事件資料夾存在
    if (!fs.existsSync(eventsPath)) {
      fs.mkdirSync(eventsPath, { recursive: true });
      return;
    }

    // 讀取事件資料夾中的所有 .js 檔案
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      try {
        // 動態引入事件模組
        const filePath = path.join(eventsPath, file);
        const fileURL = `file://${filePath}`;

        // 使用動態引入 (ES Module)
        const eventModule = await import(fileURL);
        const event = eventModule.event;

        if (event) {
          const handler = (...args) => event.execute(...args);
          eventHandlers.set(event.name, handler);
          if (event.once) {
            client.once(event.name, handler);
          } else {
            client.on(event.name, handler);
          }
        } else {
          console.warn(`⚠️ 事件檔案 ${file} 中找不到 event 導出物件`);
        }
      } catch (error) {
        console.error(`❌ 載入事件檔案 ${file} 時發生錯誤:`, error);
      }
    }
  } catch (error) {
    console.error("❌ 載入事件時發生錯誤:", error);
  }
};

/**
 * 卸載（移除）指定事件
 * @param {Client} client Discord 客戶端
 * @param {string} eventName 事件名稱
 */
export const unloadEvent = (client, eventName) => {
  const handler = eventHandlers.get(eventName);
  if (handler) {
    client.off(eventName, handler);
    eventHandlers.delete(eventName);
    console.log(`🛑 已成功卸載事件: ${eventName}`);
  } else {
    console.warn(`⚠️ 找不到對應的 handler 來卸載事件: ${eventName}`);
  }
};
