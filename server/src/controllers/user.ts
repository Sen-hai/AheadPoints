import { Request, Response } from "express";
import User from "../models/User";
import PointsHistory from "../models/PointsHistory";
import { AuthRequest } from "../middleware/auth";

// 获取用户信息
export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "请先登录！" });
    }

    const user = await User.findById(req.user._id)
      .select("-password")
      .select("+points");
      
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在！" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(500).json({ success: false, message: "获取用户信息失败！" });
  }
};

// 更新用户信息
export const updateUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "请先登录！" });
    }

    const { email, studentId } = req.body;
    const userId = req.user._id;

    // 检查邮箱是否被其他用户使用
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "该邮箱已被使用！" });
    }

    // 检查学号是否被其他用户使用
    const existingStudentId = await User.findOne({
      studentId,
      _id: { $ne: userId },
    });
    if (existingStudentId) {
      return res
        .status(400)
        .json({ success: false, message: "该学号已被使用！" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, studentId },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "用户不存在！" });
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("更新用户信息错误:", error);
    res.status(500).json({ success: false, message: "更新用户信息失败！" });
  }
};

// 修改密码
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "请先登录！" });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在！" });
    }

    // 验证当前密码
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ success: false, message: "当前密码错误！" });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "密码修改成功！" });
  } catch (error) {
    console.error("修改密码错误:", error);
    res.status(500).json({ success: false, message: "修改密码失败！" });
  }
};

// 获取积分历史
export const getPointsHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "请先登录！" });
    }

    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const history = await PointsHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await PointsHistory.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error("获取积分历史错误:", error);
    res.status(500).json({ success: false, message: "获取积分历史失败！" });
  }
};
