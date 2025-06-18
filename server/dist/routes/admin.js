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
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const admin_1 = require("../controllers/admin");
const router = express_1.default.Router();
// 添加管理员认证中间件
router.use(auth_1.auth);
router.use(auth_1.isAdmin);
// 获取所有用户列表
router.get("/users", admin_1.getAllUsers);
// 获取用户积分历史
router.get("/users/:userId/points-history", admin_1.getUserPointsHistory);
// 删除用户
router.delete("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // 防止删除自己
        if (req.user && id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "不能删除自己的账号",
            });
        }
        const user = yield User_1.default.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "用户不存在",
            });
        }
        res.json({
            success: true,
            message: "用户删除成功",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "删除用户失败",
        });
    }
}));
exports.default = router;
