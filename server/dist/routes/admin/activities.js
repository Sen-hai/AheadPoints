"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const activityController_1 = require("../../controllers/activityController");
const router = express_1.default.Router();
// 需要管理员权限的路由
router.use(auth_1.auth);
router.use(auth_1.isAdmin);
// 获取所有活动
router.get("/", activityController_1.getActivities);
// 创建活动（带图片上传）
router.post("/", activityController_1.upload.single("image"), activityController_1.createActivity);
// 删除活动
router.delete("/:id", activityController_1.deleteActivity);
// 获取活动参与者
router.get("/:id/participants", activityController_1.getActivityParticipants);
// 审核活动参与者
router.patch("/:activityId/participants/:participantId", activityController_1.approveParticipant);
exports.default = router;
