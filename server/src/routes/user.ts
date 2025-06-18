import express from "express";
import {
  getUserInfo,
  updateUserInfo,
  changePassword,
  getPointsHistory,
} from "../controllers/user";
import { auth } from "../middleware/auth";

const router = express.Router();

// 所有路由都需要认证
router.use(auth);

// 获取用户信息
router.get("/info", getUserInfo);

// 更新用户信息
router.put("/info", updateUserInfo);

// 修改密码
router.put("/password", changePassword);

// 获取积分历史
router.get("/points/history", getPointsHistory);

export default router;
