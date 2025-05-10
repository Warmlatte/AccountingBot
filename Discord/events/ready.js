import { Events } from "discord.js";
import { registerCommands } from "../utils/commandRegister.js";
// import { unloadEvent } from "../utils/eventLoader.js";

/**
 * 機器人啟動完成事件處理
 */
const handleReady = async (client) => {
  // 註冊斜線命令
  await registerCommands();
};

export const event = {
  name: Events.ClientReady,
  once: true,
  execute: handleReady,
};

// 測試卸載
// setTimeout((client) => {
//   unloadEvent(client, "ready");
// }, 10000);
