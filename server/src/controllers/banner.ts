import { Request, Response } from "express";
import Banner from "../models/Banner";
import path from "path";
import fs from "fs";

// 扩展Request类型以包含用户信息
interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

// 获取所有轮播图
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    console.error("获取轮播图列表失败:", error);
    return res.status(500).json({
      success: false,
      message: "获取轮播图列表失败",
      error: error.message,
    });
  }
};

// 上传轮播图
export const uploadBanner = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "请选择要上传的图片",
      });
    }

    // 检查用户是否为管理员
    if (req.user?.role !== "admin") {
      // 如果上传了文件但用户不是管理员，则删除已上传的文件
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(403).json({
        success: false,
        message: "只有管理员才能上传轮播图",
      });
    }

    const fileUrl = `/uploads/banners/${req.file.filename}`;

    // 创建新的轮播图记录
    const banner = new Banner({
      url: fileUrl,
      title: req.body.title || "轮播图",
      order: req.body.order || 0,
    });

    await banner.save();

    return res.status(201).json({
      success: true,
      data: banner,
      message: "轮播图上传成功",
    });
  } catch (error: any) {
    console.error("轮播图上传失败:", error);

    // 如果上传过程中出错，删除已上传的文件
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "轮播图上传失败",
      error: error.message,
    });
  }
};

// 删除轮播图
export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;

    // 检查用户是否为管理员
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "只有管理员才能删除轮播图",
      });
    }

    // 查找要删除的轮播图
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "轮播图不存在",
      });
    }

    // 删除文件系统中的图片
    const uploadDir = path.join(__dirname, "../../", banner.url);
    if (fs.existsSync(uploadDir)) {
      fs.unlinkSync(uploadDir);
    }

    // 从数据库中删除轮播图记录
    await Banner.findByIdAndDelete(bannerId);

    return res.status(200).json({
      success: true,
      message: "轮播图删除成功",
    });
  } catch (error: any) {
    console.error("轮播图删除失败:", error);
    return res.status(500).json({
      success: false,
      message: "轮播图删除失败",
      error: error.message,
    });
  }
};

// 更新轮播图信息
export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;
    const { title, order, isActive } = req.body;

    // 检查用户是否为管理员
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "只有管理员才能更新轮播图",
      });
    }

    // 查找要更新的轮播图
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "轮播图不存在",
      });
    }

    // 更新轮播图信息
    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      {
        title: title !== undefined ? title : banner.title,
        order: order !== undefined ? order : banner.order,
        isActive: isActive !== undefined ? isActive : banner.isActive,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedBanner,
      message: "轮播图更新成功",
    });
  } catch (error: any) {
    console.error("轮播图更新失败:", error);
    return res.status(500).json({
      success: false,
      message: "轮播图更新失败",
      error: error.message,
    });
  }
};
