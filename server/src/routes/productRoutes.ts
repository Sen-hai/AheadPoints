import express from "express";
import {
  getProducts,
  getProductById,
  exchangeProduct,
  getUserExchanges,
} from "../controllers/productController";
import { auth } from "../middleware/auth";

const router = express.Router();

// 用户端路由
router.get("/", getProducts); // 获取商品列表
router.get("/:id", getProductById); // 获取商品详情
router.post("/exchange", auth, exchangeProduct); // 兑换商品
router.get("/exchanges/my", auth, getUserExchanges); // 获取我的兑换记录

export default router; 