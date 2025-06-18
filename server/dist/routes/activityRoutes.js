"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activityController_1 = require("../controllers/activityController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 活动类型相关路由
router.post("/types", auth_1.isAdmin, activityController_1.createActivityType);
router.get("/types", activityController_1.getActivityTypes);
// 活动相关路由
router.post("/", auth_1.isAdmin, activityController_1.createActivity);
router.get("/", activityController_1.getActivities);
router.get("/:id", activityController_1.getActivity);
router.patch("/:id/status", auth_1.isAdmin, activityController_1.updateActivityStatus);
// 用户报名活动
router.post("/:id/join", auth_1.auth, activityController_1.joinActivity);
exports.default = router;
