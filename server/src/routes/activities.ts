import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  joinActivity,
  checkInActivity,
  getActivityCheckinStatus,
} from "../controllers/activityController";

const router = express.Router();

// 需要身份验证的路由
router.use(authenticateToken);

// 活动管理路由
router.post("/", createActivity);
router.get("/", getAllActivities);
router.get("/:id", getActivityById);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

// 活动参与路由
router.post("/:id/join", joinActivity);

// 活动签到路由
router.post("/:id/checkin", checkInActivity);
router.get("/:id/checkin", getActivityCheckinStatus);

export default router;
