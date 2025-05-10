import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

// 定義斜線命令
const commands = [
  new SlashCommandBuilder()
    .setName("ocr")
    .setDescription("上傳圖片進行文字識別")
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("要識別的圖片").setRequired(true)
    )
    .toJSON(),
];

// 建立 REST 實例
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

/**
 * 註冊斜線命令
 */
export const registerCommands = async () => {
  try {
    console.log("開始註冊斜線命令...");

    // 註冊全域命令
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
  } catch (error) {
    console.error("❌ 註冊斜線命令時發生錯誤:", error);
  }
};
