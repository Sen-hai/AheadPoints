import express from "express";
import { auth, isAdmin } from "../../middleware/auth";
import {
  upload,
  createActivity,
  getActivities,
  deleteActivity,
  getActivityParticipants,
  approveParticipant,
} from "../../controllers/activityController";
import { AuthRequest } from "../../middleware/auth";
import { Response, NextFunction } from "express";

const router = express.Router();

// 需要管理员权限的路由
router.use(auth);
router.use(isAdmin);

// 创建活动（带图片上传）
router.post(
  "/",
  upload.single("image"),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log("收到创建活动请求");
    console.log("文件信息:", req.file);
    console.log("请求体:", req.body);
    next();
  },
  createActivity
);

// 获取活动列表
router.get("/", getActivities);

// 删除活动
router.delete("/:id", deleteActivity);

// 获取活动参与者
router.get("/:id/participants", getActivityParticipants);

// 审核参与者
router.put("/:id/participants/:participantId", approveParticipant);

export default router;
