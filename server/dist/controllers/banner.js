"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBanner = exports.deleteBanner = exports.uploadBanner = exports.getAllBanners = void 0;
const Banner_1 = __importDefault(require("../models/Banner"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 获取所有轮播图
const getAllBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banners = yield Banner_1.default.find({ isActive: true }).sort({
            order: 1,
            createdAt: -1,
        });
        return res.status(200).json({
            success: true,
            data: banners,
        });
    }
    catch (error) {
        console.error("获取轮播图列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取轮播图列表失败",
            error: error.message,
        });
    }
});
exports.getAllBanners = getAllBanners;
// 上传轮播图
const uploadBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "请选择要上传的图片",
            });
        }
        // 检查用户是否为管理员
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            // 如果上传了文件但用户不是管理员，则删除已上传的文件
            if (req.file.path) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                success: false,
                message: "只有管理员才能上传轮播图",
            });
        }
        const fileUrl = `/uploads/banners/${req.file.filename}`;
        // 创建新的轮播图记录
        const banner = new Banner_1.default({
            url: fileUrl,
            title: req.body.title || "轮播图",
            order: req.body.order || 0,
        });
        yield banner.save();
        return res.status(201).json({
            success: true,
            data: banner,
            message: "轮播图上传成功",
        });
    }
    catch (error) {
        console.error("轮播图上传失败:", error);
        // 如果上传过程中出错，删除已上传的文件
        if (req.file && req.file.path) {
            fs_1.default.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: "轮播图上传失败",
            error: error.message,
        });
    }
});
exports.uploadBanner = uploadBanner;
// 删除轮播图
const deleteBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bannerId = req.params.id;
        // 检查用户是否为管理员
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            return res.status(403).json({
                success: false,
                message: "只有管理员才能删除轮播图",
            });
        }
        // 查找要删除的轮播图
        const banner = yield Banner_1.default.findById(bannerId);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "轮播图不存在",
            });
        }
        // 删除文件系统中的图片
        const uploadDir = path_1.default.join(__dirname, "../../", banner.url);
        if (fs_1.default.existsSync(uploadDir)) {
            fs_1.default.unlinkSync(uploadDir);
        }
        // 从数据库中删除轮播图记录
        yield Banner_1.default.findByIdAndDelete(bannerId);
        return res.status(200).json({
            success: true,
            message: "轮播图删除成功",
        });
    }
    catch (error) {
        console.error("轮播图删除失败:", error);
        return res.status(500).json({
            success: false,
            message: "轮播图删除失败",
            error: error.message,
        });
    }
});
exports.deleteBanner = deleteBanner;
// 更新轮播图信息
const updateBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bannerId = req.params.id;
        const { title, order, isActive } = req.body;
        // 检查用户是否为管理员
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
            return res.status(403).json({
                success: false,
                message: "只有管理员才能更新轮播图",
            });
        }
        // 查找要更新的轮播图
        const banner = yield Banner_1.default.findById(bannerId);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "轮播图不存在",
            });
        }
        // 更新轮播图信息
        const updatedBanner = yield Banner_1.default.findByIdAndUpdate(bannerId, {
            title: title !== undefined ? title : banner.title,
            order: order !== undefined ? order : banner.order,
            isActive: isActive !== undefined ? isActive : banner.isActive,
        }, { new: true });
        return res.status(200).json({
            success: true,
            data: updatedBanner,
            message: "轮播图更新成功",
        });
    }
    catch (error) {
        console.error("轮播图更新失败:", error);
        return res.status(500).json({
            success: false,
            message: "轮播图更新失败",
            error: error.message,
        });
    }
});
exports.updateBanner = updateBanner;
