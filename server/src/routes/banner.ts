import express from "express";
import {
  getAllBanners,
  uploadBanner,
  deleteBanner,
  updateBanner,
} from "../controllers/banner";
import { auth, isAdmin } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// 配置文件上传
const uploadDir = path.join(__dirname, "../../uploads/banners");

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 只接受图片文件
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("只允许上传图片文件!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 限制文件大小为2MB
  },
});

// 获取所有轮播图（公开）
router.get("/", getAllBanners);

// 上传轮播图（仅管理员）
router.post("/upload", auth, isAdmin, upload.single("banner"), uploadBanner);

// 删除轮播图（仅管理员）
router.delete("/:id", auth, isAdmin, deleteBanner);

// 更新轮播图信息（仅管理员）
router.put("/:id", auth, isAdmin, updateBanner);

export default router;
