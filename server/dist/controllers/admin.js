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
exports.getUserPointsHistory = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const PointsHistory_1 = __importDefault(require("../models/PointsHistory"));
// 获取所有用户
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "没有权限执行此操作",
            });
        }
        const users = yield User_1.default.find().select("-password");
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        console.error("获取用户列表失败:", error);
        res.status(500).json({
            success: false,
            message: "获取用户列表失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.getAllUsers = getAllUsers;
// 获取用户的积分历史
const getUserPointsHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "没有权限执行此操作",
            });
        }
        const { userId } = req.params;
        const history = yield PointsHistory_1.default.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("user", "username email studentId");
        res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        console.error("获取用户积分历史失败:", error);
        res.status(500).json({
            success: false,
            message: "获取用户积分历史失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.getUserPointsHistory = getUserPointsHistory;
