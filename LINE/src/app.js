import express from "express";
import config from "./config/index.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();

app.use(express.json());

app.use(webhookRoutes);

app.listen(config.port, () => {
  console.log(`🚀 LINE Bot 伺服器運行中！監聽端口: ${config.port}`);
});

export default app;
