import express from "express";
import User from "../models/User";
import { auth, isAdmin } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { getAllUsers, getUserPointsHistory } from "../controllers/admin";

const router = express.Router();

// 添加管理员认证中间件
router.use(auth);
router.use(isAdmin);

// 获取所有用户列表
router.get("/users", getAllUsers);

// 获取用户积分历史
router.get("/users/:userId/points-history", getUserPointsHistory);

// 删除用户
router.delete("/users/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 防止删除自己
    if (req.user && id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "不能删除自己的账号",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    res.json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "删除用户失败",
    });
  }
});

export default router;
