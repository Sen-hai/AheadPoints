import express, { Router } from "express";
import {
  createActivity,
  createActivityType,
  getActivityTypes,
  getActivities,
  updateActivityStatus,
  joinActivity,
  getActivity,
  checkInActivity,
  getActivityCheckinStatus,
  approveCheckin,
  getActivityParticipants,
  getJoinedActivities,
} from "../controllers/activityController";
import { isAdmin, auth } from "../middleware/auth";
import { upload } from "../controllers/activityController";

const router: Router = express.Router();

// 活动类型相关路由
router.post("/types", isAdmin, createActivityType);
router.get("/types", getActivityTypes);

// 活动相关路由
router.post("/", isAdmin, createActivity);
router.get("/", getActivities);

// 获取用户参加的活动（注意：这个路由必须放在 :id 路由之前）
router.get("/joined", auth, getJoinedActivities as any);

// 获取单个活动
router.get("/:id", getActivity);
router.patch("/:id/status", isAdmin, updateActivityStatus);

// 用户报名活动
router.post("/:id/join", auth, joinActivity);

// 活动签到
router.post("/:id/checkin", auth, checkInActivity);

// 获取签到状态
router.get("/:id/checkin/status", auth, getActivityCheckinStatus);

// 审核签到
router.post(
  "/:activityId/participants/:participantId/checkin/approve",
  auth,
  approveCheckin
);

export default router;
