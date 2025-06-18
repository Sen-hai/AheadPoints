"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const banner_1 = require("../controllers/banner");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// 配置文件上传
const uploadDir = path_1.default.join(__dirname, "../../uploads/banners");
// 确保上传目录存在
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `banner-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    // 只接受图片文件
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("只允许上传图片文件!"));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 限制文件大小为2MB
    },
});
// 获取所有轮播图（公开）
router.get("/", banner_1.getAllBanners);
// 上传轮播图（仅管理员）
router.post("/upload", auth_1.auth, auth_1.isAdmin, upload.single("banner"), banner_1.uploadBanner);
// 删除轮播图（仅管理员）
router.delete("/:id", auth_1.auth, auth_1.isAdmin, banner_1.deleteBanner);
// 更新轮播图信息（仅管理员）
router.put("/:id", auth_1.auth, auth_1.isAdmin, banner_1.updateBanner);
exports.default = router;
