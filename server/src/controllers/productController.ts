import { Request, Response } from "express";
import Product, { IProduct } from "../models/Product";
import Exchange from "../models/Exchange";
import User from "../models/User";
import PointsHistory from "../models/PointsHistory";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/products");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("只允许上传图片文件"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 获取所有商品（用户端）
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, search = "" } = req.query;
    
    const query: any = { status: "active" };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("createdBy", "username");

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取商品列表失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取单个商品详情
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "无效的商品ID",
      });
    }

    const product = await Product.findById(id).populate("createdBy", "username");
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "商品不存在",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("获取商品详情失败:", error);
    res.status(500).json({
      success: false,
      message: "获取商品详情失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 兑换商品
export const exchangeProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "请先登录",
      });
    }

    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "无效的商品ID",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "兑换数量必须大于0",
      });
    }

    // 查找商品
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "商品不存在",
      });
    }

    if (product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "商品已下架",
      });
    }

    // 检查库存
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "商品库存不足",
      });
    }

    // 计算所需积分
    const totalPoints = product.price * quantity;

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    // 检查用户积分
    if (user.points < totalPoints) {
      return res.status(400).json({
        success: false,
        message: "积分不足",
        data: {
          required: totalPoints,
          current: user.points,
          shortage: totalPoints - user.points,
        },
      });
    }

    // 使用findOneAndUpdate来原子性地更新用户积分
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, points: { $gte: totalPoints } },
      { $inc: { points: -totalPoints } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "积分扣除失败，请重试",
      });
    }

    // 使用findOneAndUpdate来原子性地更新商品库存
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!updatedProduct) {
      // 如果商品库存更新失败，回滚用户积分
      await User.findByIdAndUpdate(userId, { $inc: { points: totalPoints } });
      return res.status(400).json({
        success: false,
        message: "商品库存不足，请重试",
      });
    }

    // 创建兑换记录
    const exchange = new Exchange({
      user: userId,
      product: productId,
      quantity,
      pointsUsed: totalPoints,
      status: "completed",
      exchangeTime: new Date(),
    });
    await exchange.save();

    // 记录积分历史
    const pointsHistory = new PointsHistory({
      user: userId,
      points: totalPoints,
      type: "spent",
      description: `兑换商品: ${product.name} x${quantity}`,
      relatedExchange: exchange._id,
    });
    await pointsHistory.save();

    res.json({
      success: true,
      message: "兑换成功",
      data: {
        exchange,
        remainingPoints: updatedUser.points,
      },
    });
  } catch (error) {
    console.error("兑换商品失败:", error);
    res.status(500).json({
      success: false,
      message: "兑换商品失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取用户兑换记录
export const getUserExchanges = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "请先登录",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const exchanges = await Exchange.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("product", "name image price")
      .populate("user", "username");

    const total = await Exchange.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        exchanges,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("获取兑换记录失败:", error);
    res.status(500).json({
      success: false,
      message: "获取兑换记录失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// ===== 管理员功能 =====

// 获取所有商品（管理员）
export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("createdBy", "username");

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取商品列表失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 创建商品
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { name, description, price, stock, status = "active" } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "商品名称、价格和库存为必填项",
      });
    }

    if (price < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "价格和库存不能为负数",
      });
    }

    const product = new Product({
      name,
      description,
      image,
      price: Number(price),
      stock: Number(stock),
      status,
      createdBy: req.user._id,
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("createdBy", "username");

    res.status(201).json({
      success: true,
      message: "商品创建成功",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("创建商品失败:", error);
    res.status(500).json({
      success: false,
      message: "创建商品失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 更新商品
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { id } = req.params;
    const { name, description, price, stock, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "无效的商品ID",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "商品不存在",
      });
    }

    // 更新字段
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: "价格不能为负数",
        });
      }
      product.price = Number(price);
    }
    if (stock !== undefined) {
      if (stock < 0) {
        return res.status(400).json({
          success: false,
          message: "库存不能为负数",
        });
      }
      product.stock = Number(stock);
    }
    if (status !== undefined) product.status = status;

    // 如果有新图片，更新图片
    if (req.file) {
      // 删除旧图片
      if (product.image) {
        const oldImagePath = path.join(__dirname, "../../", product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("createdBy", "username");

    res.json({
      success: true,
      message: "商品更新成功",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("更新商品失败:", error);
    res.status(500).json({
      success: false,
      message: "更新商品失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 删除商品
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "无效的商品ID",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "商品不存在",
      });
    }

    // 检查是否有相关的兑换记录
    const exchangeCount = await Exchange.countDocuments({ product: id });
    if (exchangeCount > 0) {
      return res.status(400).json({
        success: false,
        message: "该商品存在兑换记录，无法删除",
      });
    }

    // 删除商品图片
    if (product.image) {
      const imagePath = path.join(__dirname, "../../", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "商品删除成功",
    });
  } catch (error) {
    console.error("删除商品失败:", error);
    res.status(500).json({
      success: false,
      message: "删除商品失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取所有兑换记录（管理员）
export const getAllExchanges = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "没有权限执行此操作",
      });
    }

    const { page = 1, limit = 10, userId = "", productId = "" } = req.query;
    
    const query: any = {};
    if (userId) {
      query.user = userId;
    }
    if (productId) {
      query.product = productId;
    }

    const exchanges = await Exchange.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("user", "username email studentId")
      .populate("product", "name image price");

    const total = await Exchange.countDocuments(query);

    res.json({
      success: true,
      data: {
        exchanges,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("获取兑换记录失败:", error);
    res.status(500).json({
      success: false,
      message: "获取兑换记录失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
}; 