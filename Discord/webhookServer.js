import express from "express";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhookRoutes.js";

// 載入環境變數
dotenv.config();

// 建立 Express 應用
const app = express();

// 中間件
app.use(express.json());

// 路由
app.use("/api", webhookRoutes);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error("伺服器錯誤:", err);
  res.status(500).send({
    error: "伺服器內部錯誤",
    message: err.message,
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`📡 Webhook 接口監聽中: http://localhost:${PORT}/api/ocr`);
});
