import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// 建立 Discord 客戶端實例
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// 載入所有事件
import { loadEvents } from "./utils/eventLoader.js";
(async () => {
  await loadEvents(client);
})();

// 登入 Discord
client.login(process.env.DISCORD_TOKEN);

// 導出 client 供其他模組使用
export { client };

// 載入 webhook server
import "./webhookServer.js";
