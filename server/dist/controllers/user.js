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
exports.getPointsHistory = exports.changePassword = exports.updateUserInfo = exports.getUserInfo = void 0;
const User_1 = __importDefault(require("../models/User"));
const PointsHistory_1 = __importDefault(require("../models/PointsHistory"));
// 获取用户信息
const getUserInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "请先登录！" });
        }
        const user = yield User_1.default.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "用户不存在！" });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error("获取用户信息错误:", error);
        res.status(500).json({ success: false, message: "获取用户信息失败！" });
    }
});
exports.getUserInfo = getUserInfo;
// 更新用户信息
const updateUserInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "请先登录！" });
        }
        const { email, studentId } = req.body;
        const userId = req.user._id;
        // 检查邮箱是否被其他用户使用
        const existingEmail = yield User_1.default.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
            return res
                .status(400)
                .json({ success: false, message: "该邮箱已被使用！" });
        }
        // 检查学号是否被其他用户使用
        const existingStudentId = yield User_1.default.findOne({
            studentId,
            _id: { $ne: userId },
        });
        if (existingStudentId) {
            return res
                .status(400)
                .json({ success: false, message: "该学号已被使用！" });
        }
        const updatedUser = yield User_1.default.findByIdAndUpdate(userId, { email, studentId }, { new: true, select: "-password" });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "用户不存在！" });
        }
        res.json({ success: true, data: updatedUser });
    }
    catch (error) {
        console.error("更新用户信息错误:", error);
        res.status(500).json({ success: false, message: "更新用户信息失败！" });
    }
});
exports.updateUserInfo = updateUserInfo;
// 修改密码
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "请先登录！" });
        }
        const { currentPassword, newPassword } = req.body;
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "用户不存在！" });
        }
        // 验证当前密码
        const isValidPassword = yield user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res
                .status(400)
                .json({ success: false, message: "当前密码错误！" });
        }
        // 更新密码
        user.password = newPassword;
        yield user.save();
        res.json({ success: true, message: "密码修改成功！" });
    }
    catch (error) {
        console.error("修改密码错误:", error);
        res.status(500).json({ success: false, message: "修改密码失败！" });
    }
});
exports.changePassword = changePassword;
// 获取积分历史
const getPointsHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "请先登录！" });
        }
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;
        const history = yield PointsHistory_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = yield PointsHistory_1.default.countDocuments({ user: userId });
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
    }
    catch (error) {
        console.error("获取积分历史错误:", error);
        res.status(500).json({ success: false, message: "获取积分历史失败！" });
    }
});
exports.getPointsHistory = getPointsHistory;
