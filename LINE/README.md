# LINE Bot 發票辨識系統

這是一個用於辨識發票的 LINE Bot 系統，整合了 n8n 作為 OCR 處理引擎。

## 系統架構

系統採用簡單的模組化設計，主要負責：

1. **接收圖片**：LINE Bot 接收用戶發送的發票圖片
2. **轉發到 n8n**：將圖片轉發到 n8n 進行 OCR 處理
3. **接收 OCR 結果**：提供 API 端點讓 n8n 回傳 OCR 結果
4. **回覆用戶**：將辨識結果回覆給用戶

## 模組化設計

系統使用模組化架構設計，包含以下控制器：

- **messageController.js**：主控制器，整合其他控制器
- **textController.js**：處理文字訊息
- **stickerController.js**：處理貼圖訊息
- **imageController.js**：處理圖片訊息，將圖片發送到 n8n
- **invoiceController.js**：處理發票相關功能

## 環境設置

1. 創建 `.env` 檔案，設定以下環境變數：

```
# 服務配置
PORT=8080

# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# n8n OCR 服務
N8N_ENDPOINT=https://your-n8n-server/webhook/ocr
```

2. 安裝依賴：

```
npm install
```

3. 啟動服務：

```
npm start
```

## 工作流程

1. 用戶發送發票圖片到 LINE Bot
2. LINE Bot 將圖片和相關參數（reply_token, user_id 等）轉發到 n8n
3. n8n 執行 OCR 處理並獲取發票資訊（發票號碼、日期、金額等）
4. n8n 將結果回傳到 LINE Bot API 端點
5. LINE Bot 將結果回覆給用戶

## API 端點

### LINE Webhook

- **路徑**：`/webhook`
- **方法**：POST
- **描述**：接收來自 LINE 平台的事件

### OCR 結果接收 (統一端點)

- **路徑**：`/receiveOcrData`
- **方法**：POST
- **參數**：
  - `reply_token`：LINE 回覆令牌 (用於文字回覆)
  - `user_id`：用戶 ID (用於 Flex Message 回覆)
  - `invoiceNumber`：發票號碼
  - `date`：日期
  - `amount`：金額
  - `imageUrl`：圖片網址
  - `use_flex`：是否使用 Flex Message (布林值，預設 false)
- **描述**：接收 OCR 結果並回覆用戶
- **回覆方式**：
  - 如果提供 `reply_token` 且 `use_flex` 為 false，使用文字回覆
  - 如果提供 `user_id`，使用 Flex Message 回覆

## n8n 設置說明

在 n8n 的工作流程中，您應該：

1. 使用 Webhook 節點接收來自 LINE Bot 的圖片
2. 執行 OCR 處理獲取發票資訊
3. 將結果回傳到 LINE Bot 的 API 端點：
   - 發送 POST 請求到 `https://your-server.com/receiveOcrData`
   - 如果希望使用簡單文字回覆，包含 `reply_token` 參數
   - 如果希望使用 Flex Message，包含 `user_id` 參數

### POST 請求範例

使用文字回覆：
```json
{
  "reply_token": "從LINE獲取的reply_token",
  "invoiceNumber": "AB12345678",
  "date": "2023/09/15",
  "amount": "123"
}
```

使用 Flex Message 回覆：
```json
{
  "user_id": "U1234567890abcdef",
  "invoiceNumber": "AB12345678",
  "date": "2023/09/15",
  "amount": "123",
  "imageUrl": "https://example.com/receipt.jpg"
}
```
