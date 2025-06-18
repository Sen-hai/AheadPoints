import express from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllExchanges,
  upload,
} from "../../controllers/productController";
import { auth, isAdmin } from "../../middleware/auth";

const router = express.Router();

// 管理员商品管理路由
router.get("/", auth, isAdmin, getAllProducts); // 获取所有商品
router.post("/", auth, isAdmin, upload.single("image"), createProduct); // 创建商品
router.put("/:id", auth, isAdmin, upload.single("image"), updateProduct); // 更新商品
router.delete("/:id", auth, isAdmin, deleteProduct); // 删除商品

// 管理员兑换记录管理路由
router.get("/exchanges", auth, isAdmin, getAllExchanges); // 获取所有兑换记录

export default router; 