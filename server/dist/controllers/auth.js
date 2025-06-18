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
exports.updateUserInfo = exports.getUserInfo = exports.updatePassword = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, email, studentId, walletAddress } = req.body;
        // 检查用户名是否已存在
        const existingUsername = yield User_1.default.findOne({ username });
        if (existingUsername) {
            return res
                .status(400)
                .json({ success: false, message: "用户名已存在！" });
        }
        // 检查邮箱是否已存在
        const existingEmail = yield User_1.default.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "邮箱已存在！" });
        }
        // 检查学号是否已存在
        const existingStudentId = yield User_1.default.findOne({ studentId });
        if (existingStudentId) {
            return res.status(400).json({ success: false, message: "学号已存在！" });
        }
        // 检查钱包地址是否已存在
        if (walletAddress) {
            const existingWallet = yield User_1.default.findOne({ walletAddress });
            if (existingWallet) {
                return res
                    .status(400)
                    .json({ success: false, message: "该钱包地址已被注册！" });
            }
        }
        // 创建新用户
        const user = new User_1.default({
            username,
            password,
            email,
            studentId,
            walletAddress,
            role: "user",
        });
        yield user.save();
        res.status(201).json({ success: true, message: "注册成功！" });
    }
    catch (error) {
        console.error("注册错误:", error);
        if (error.code === 11000) {
            // 这里处理其他可能的唯一性冲突，虽然理论上前面已检查
            return res
                .status(400)
                .json({
                success: false,
                message: "注册信息包含已存在的数据，请检查！",
            });
        }
        res.status(500).json({ success: false, message: "注册失败，请稍后重试！" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, walletAddress } = req.body;
        // 查找用户
        const user = yield User_1.default.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "用户名或密码错误！" });
        }
        // 验证密码
        const isValidPassword = yield user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "用户名或密码错误！" });
        }
        // 验证钱包地址（如果提供了）
        if (walletAddress &&
            user.walletAddress &&
            user.walletAddress !== walletAddress) {
            return res.status(401).json({ message: "钱包地址与账户不匹配！" });
        }
        // 生成 JWT token
        const token = jsonwebtoken_1.default.sign({
            _id: user._id,
            username: user.username,
            role: user.role,
        }, JWT_SECRET, { expiresIn: "24h" });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                studentId: user.studentId,
                walletAddress: user.walletAddress,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("登录错误:", error);
        res.status(500).json({ message: "登录失败，请稍后重试！" });
    }
});
exports.login = login;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "未登录" });
        }
        const { currentPassword, newPassword } = req.body;
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "用户不存在" });
        }
        const isValidPassword = yield user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({ message: "当前密码错误" });
        }
        user.password = newPassword;
        yield user.save();
        res.status(200).json({ message: "密码更新成功" });
    }
    catch (error) {
        console.error("更新密码错误:", error);
        res.status(500).json({ message: "更新密码失败，请稍后重试" });
    }
});
exports.updatePassword = updatePassword;
const getUserInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "未登录" });
        }
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "用户不存在" });
        }
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                studentId: user.studentId,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("获取用户信息错误:", error);
        res.status(500).json({ message: "获取用户信息失败，请稍后重试" });
    }
});
exports.getUserInfo = getUserInfo;
const updateUserInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "未登录" });
        }
        const { email, studentId } = req.body;
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "用户不存在" });
        }
        user.email = email;
        user.studentId = studentId;
        yield user.save();
        res.status(200).json({ message: "用户信息更新成功" });
    }
    catch (error) {
        console.error("更新用户信息错误:", error);
        res.status(500).json({ message: "更新用户信息失败，请稍后重试" });
    }
});
exports.updateUserInfo = updateUserInfo;
