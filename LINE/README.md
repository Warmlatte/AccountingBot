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
- **invoiceController.js**：處理發票相關功能，包括分類與儲存

## 環境設置

1. 創建 `.env` 檔案，設定以下環境變數：

```
# 服務配置
PORT=8080

# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# n8n 服務 - 基礎URL
# 系統會自動添加 /ocrWebhook 與 /saveWebhook 端點
N8N_ENDPOINT=https://your-n8n-server
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
2. LINE Bot 將圖片和相關參數（reply_token, user_id 等）轉發到 n8n 的 /ocrWebhook
3. n8n 執行 OCR 處理並獲取發票資訊（發票號碼、日期、金額等）
4. n8n 將結果回傳到 LINE Bot API 端點
5. LINE Bot 顯示辨識結果並讓用戶確認/修改資訊
6. 用戶選擇消費分類
7. LINE Bot 將最終資料傳送到 n8n 的 /saveWebhook 進行儲存
8. n8n 處理儲存並回傳成功訊息

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

### 記帳結果通知

- **路徑**：`/notifySavedResult`
- **方法**：POST
- **參數**：
  - `user_id`：用戶 ID
  - `category`：消費分類
  - `amount`：金額
  - `date`：日期
  - `imageUrl`：圖片網址（可選）
  - `success`：操作是否成功（預設true）
  - `message`：失敗時的錯誤訊息（可選）
- **描述**：接收保存結果通知並回覆用戶

## n8n 設置說明

在 n8n 中，您需要設置兩個 Webhook 節點：

### 1. OCR Webhook (/ocrWebhook)

1. 使用 Webhook 節點接收來自 LINE Bot 的圖片
2. 執行 OCR 處理獲取發票資訊
3. 將結果回傳到 LINE Bot 的 API 端點：
   - 發送 POST 請求到 `https://your-server.com/receiveOcrData`
   - 包含 `user_id` 等參數
   
### 2. Save Webhook (/saveWebhook)

1. 使用 Webhook 節點接收來自 LINE Bot 的確認後資料
2. 處理圖片存檔和資料存儲
3. 將結果回傳到 LINE Bot 的通知端點：
   - 發送 POST 請求到 `https://your-server.com/notifySavedResult`
   - 包含 `user_id`、`category` 等參數

### 請求範例

OCR結果回傳：
```json
{
  "user_id": "U1234567890abcdef",
  "invoiceNumber": "AB12345678",
  "date": "2023/09/15",
  "amount": "123",
  "imageUrl": "https://example.com/receipt.jpg"
}
```

保存結果回傳：
```json
{
  "user_id": "U1234567890abcdef",
  "category": "餐飲",
  "amount": "123",
  "date": "2023/09/15",
  "imageUrl": "https://example.com/receipt.jpg",
  "success": true
}
```
