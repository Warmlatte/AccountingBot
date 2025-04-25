# AccountingBot

LINE 和 Discord 機器人，用於發票辨識和記帳功能整合。

## 專案結構

專案包含兩個主要子系統：

- **LINE Bot**：用於 LINE 平台的發票辨識和記帳機器人
- **Discord Bot**：用於 Discord 平台的記帳機器人

## LINE Bot 功能

- 發票圖片辨識
- OCR 文字識別
- Flex Message 互動界面
- 集成 n8n 工作流進行處理

詳細說明請見 [LINE Bot README](./LINE/README.md)

## Discord Bot 功能

- 記帳功能
- 數據分析
- 圖表生成

## 環境需求

- Node.js 16+
- npm 或 yarn
- n8n (用於 OCR 處理)

## 安裝與設置

每個子系統都有各自的安裝指南：

- [LINE Bot 安裝指南](./LINE/README.md)
- [Discord Bot 安裝指南](./Discord/README.md)

## 授權協議

MIT 