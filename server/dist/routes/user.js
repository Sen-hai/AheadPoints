"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 所有路由都需要认证
router.use(auth_1.auth);
// 获取用户信息
router.get("/info", user_1.getUserInfo);
// 更新用户信息
router.put("/info", user_1.updateUserInfo);
// 修改密码
router.put("/password", user_1.changePassword);
// 获取积分历史
router.get("/points/history", user_1.getPointsHistory);
exports.default = router;
