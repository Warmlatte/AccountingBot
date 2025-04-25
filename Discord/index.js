import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// 載入事件

dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// 啟用功能

// 當機器人準備好時的事件
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot 已啟動，登入為：${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
