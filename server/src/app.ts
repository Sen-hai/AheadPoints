import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import activityRoutes from "./routes/activityRoutes";
import adminActivityRoutes from "./routes/admin/activities";
import bannerRoutes from "./routes/banner";
import productRoutes from "./routes/productRoutes";
import adminProductRoutes from "./routes/admin/productRoutes";
import { processActivityPoints } from "./controllers/activityController";

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/admin/activities", adminActivityRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin/products", adminProductRoutes);

// 设置定时任务，每5分钟检查一次是否需要发放积分
setInterval(processActivityPoints, 5 * 60 * 1000);

// 启动时也执行一次
processActivityPoints();

// 错误处理中间件
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

export default app;
