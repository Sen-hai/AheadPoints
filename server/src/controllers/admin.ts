import { Request, Response } from "express";
import User from "../models/User";
import PointsHistory from "../models/PointsHistory";
import { AuthRequest } from "../middleware/auth";

// 获取所有用户
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const users = await User.find().select("-password");
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取用户列表失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取用户的积分历史
export const getUserPointsHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { userId } = req.params;
    const history = await PointsHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "username email studentId");

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("获取用户积分历史失败:", error);
    res.status(500).json({
      success: false,
      message: "获取用户积分历史失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};
