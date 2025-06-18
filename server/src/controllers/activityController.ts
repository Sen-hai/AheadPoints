import { Request, Response } from "express";
import Activity, { IActivity, IParticipant } from "../models/Activity";
import ActivityType from "../models/ActivityType";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import PointsHistory from "../models/PointsHistory";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import mongoose, { Types } from "mongoose";
import { RequestHandler } from "express-serve-static-core";

// 处理活动结束后的积分发放
export const processActivityPoints = async () => {
  try {
    console.log("开始处理活动积分...");

    // 查找所有已结束但未处理积分的活动
    const activities = await Activity.find({
      endTime: { $lte: new Date() }, // 活动已结束
      "participants.pointsAwarded": { $ne: true }, // 有参与者未获得积分
    });

    console.log(`找到 ${activities.length} 个需要处理积分的活动`);

    for (const activity of activities) {
      console.log(`处理活动: ${activity.title}`);

      // 查找所有已签到但未获得积分的参与者
      const participants =
        activity.participants?.filter(
          (p) => p.checkinStatus === "approved" && !p.pointsAwarded
        ) || [];

      console.log(
        `活动 ${activity.title} 有 ${participants.length} 个参与者需要发放积分`
      );

      for (const participant of participants) {
        const user = await User.findById(participant.user);
        if (user) {
          // 发放积分
          user.points += activity.points;
          await user.save();

          // 记录积分历史
          await PointsHistory.create({
            user: participant.user,
            points: activity.points,
            type: "earned",
            description: `参与活动: ${activity.title}`,
            relatedActivity: activity._id,
          });

          // 标记该参与者已获得积分
          participant.pointsAwarded = true;
          console.log(`用户 ${user.username} 获得 ${activity.points} 积分`);
        }
      }

      // 保存活动更新
      await activity.save();
      console.log(`活动 ${activity.title} 积分处理完成`);
    }
  } catch (error) {
    console.error("处理活动积分失败:", error);
  }
};

// 设置定时任务，每分钟检查一次
setInterval(processActivityPoints, 60 * 1000);

// 自定义类型定义
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadDir = path.join(__dirname, "../../uploads/activities");
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log("上传目录:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log("生成的文件名:", filename);
    cb(null, filename);
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传jpg/jpeg/png格式的图片！"));
    }
  },
});

// 创建活动类型
export const createActivityType = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const activityType = await ActivityType.create({
      name,
      description,
    });
    res.status(201).json(activityType);
  } catch (error: any) {
    if (error.code === 11000) {
      // MongoDB 重复键错误
      return res.status(400).json({ message: "该活动类型名称已存在" });
    }
    res.status(500).json({ message: "创建活动类型失败", error: error.message });
  }
};

// 获取所有活动类型
export const getActivityTypes = async (req: Request, res: Response) => {
  try {
    const activityTypes = await ActivityType.find().sort({ createdAt: -1 });
    res.json(activityTypes);
  } catch (error: any) {
    res.status(500).json({ message: "获取活动类型失败", error: error.message });
  }
};

// 创建活动
export const createActivity = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      points,
      startTime,
      endTime,
      registrationEndTime,
      location,
      latitude,
      longitude,
      maxParticipants,
      isTeamActivity,
      minTeamSize,
      maxTeamSize,
      checkinRequired,
      checkinEndTime,
    } = req.body;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    // 验证必填字段
    if (
      !title ||
      !description ||
      !type ||
      !points ||
      !startTime ||
      !endTime ||
      !registrationEndTime
    ) {
      return res.status(400).json({
        success: false,
        message: "缺少必填字段",
      });
    }

    // 如果需要签到，验证签到相关字段
    if (checkinRequired) {
      if (!checkinEndTime) {
        return res.status(400).json({
          success: false,
          message: "启用签到时必须设置签到截止时间",
        });
      }

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "启用签到时必须设置活动位置的经纬度",
        });
      }
    }

    // 处理图片上传
    let imagePath = undefined;
    if (req.file) {
      imagePath = "/uploads/activities/" + req.file.filename;
      console.log("上传的图片路径:", imagePath);
    }

    const activity = new Activity({
      title,
      description,
      type,
      points,
      startTime,
      endTime,
      registrationEndTime,
      location,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      maxParticipants,
      isTeamActivity,
      minTeamSize,
      maxTeamSize,
      checkinRequired,
      checkinEndTime,
      createdBy: userId,
      status: "published",
      image: imagePath,
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: "活动创建成功",
      data: activity,
    });
  } catch (error) {
    console.error("创建活动失败:", error);
    res.status(500).json({
      success: false,
      message: "创建活动失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取所有活动
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { status, type, startDate, endDate, showAll } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // 默认只返回报名期限内的活动，除非明确指定showAll=true
    if (showAll !== "true") {
      query.registrationEndTime = { $gte: new Date() };
      query.status = "published"; // 只显示已发布的活动
    }

    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .populate("type", "name")
      .populate("createdBy", "username");

    // 使用JSON序列化和反序列化处理MongoDB ObjectId，将其转换为字符串
    // 这样前端在比较用户ID时就不会有问题
    const processedActivities = JSON.parse(JSON.stringify(activities));

    // 额外检查确保所有参与者的user字段都是字符串
    processedActivities.forEach((activity: any) => {
      if (activity.participants && activity.participants.length > 0) {
        activity.participants.forEach((participant: any) => {
          if (participant.user && typeof participant.user !== "string") {
            participant.user = participant.user.toString();
          }
        });
      }
    });

    res.json({
      success: true,
      data: processedActivities,
    });
  } catch (error: any) {
    console.error("获取活动列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取活动列表失败",
      error: error.message,
    });
  }
};

// 删除活动
export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    // 如果有图片，删除图片文件
    if (activity.image) {
      const imagePath = path.join(__dirname, "../../", activity.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await activity.deleteOne();

    res.json({
      success: true,
      message: "活动删除成功",
    });
  } catch (error) {
    console.error("删除活动失败:", error);
    res.status(500).json({
      success: false,
      message: "删除活动失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 更新活动状态
export const updateActivityStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "请先登录" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "活动不存在" });
    }

    // 检查是否是创建者或管理员
    if (
      activity.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "没有权限更新此活动" });
    }

    activity.status = status;
    await activity.save();
    await activity.populate(["type", "createdBy"]);

    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ message: "更新活动状态失败", error: error.message });
  }
};

// 用户报名活动
export const joinActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "请先登录",
      });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    // 检查是否已经报名
    const existingParticipant = activity.participants?.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "您已经报名过这个活动了",
      });
    }

    // 检查是否超过最大参与人数
    if (
      activity.maxParticipants &&
      activity.participants &&
      activity.participants.length >= activity.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: "活动报名人数已满",
      });
    }

    // 创建新的参与者记录，状态直接设置为 approved
    const participant: IParticipant = {
      user: new Types.ObjectId(userId),
      status: "approved" as const, // 明确指定类型
      joinTime: new Date(),
      teamMembers: [], // 添加必需的字段
    };

    // 添加到参与者列表
    if (!activity.participants) {
      activity.participants = [];
    }
    activity.participants.push(participant);

    await activity.save();

    return res.json({
      success: true,
      message: "报名成功",
      data: {
        participantsCount: activity.participants.length,
      },
    });
  } catch (error) {
    console.error("报名失败:", error);
    return res.status(500).json({
      success: false,
      message: "报名失败，请重试",
    });
  }
};

// 获取活动参与者
export const getActivityParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // 查找活动并填充用户信息
    const activity = await Activity.findById(id).populate({
      path: "participants.user",
      select: "username email studentId points",
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    res.json({
      success: true,
      data: activity.participants,
    });
  } catch (error) {
    console.error("获取活动参与者失败:", error);
    res.status(500).json({
      success: false,
      message: "获取活动参与者失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 审核活动参与者
export const approveParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, participantId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "审核状态无效，必须是 'approved' 或 'rejected'",
      });
    }

    // 查找活动
    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    // 确保participants数组存在
    if (!activity.participants || activity.participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "该活动没有参与者",
      });
    }

    // 查找参与者
    const participantIndex = activity.participants.findIndex(
      (p) => p._id && p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "该参与者不存在",
      });
    }

    const participant = activity.participants[participantIndex];

    // 更新状态
    participant.status = status as "approved" | "rejected";

    await activity.save();

    res.json({
      success: true,
      message: status === "approved" ? "已批准参与者" : "已拒绝参与者",
    });
  } catch (error) {
    console.error("审核参与者失败:", error);
    res.status(500).json({
      success: false,
      message: "审核参与者失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 审核签到
export const approveCheckin = async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, participantId } = req.params;
    const { status, note } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "审核状态无效，必须是 'approved' 或 'rejected'",
      });
    }

    // 查找活动
    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    // 确保participants数组存在
    if (!activity.participants || activity.participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "该活动没有参与者",
      });
    }

    // 查找参与者
    const participantIndex = activity.participants.findIndex(
      (p) => p._id && p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "该参与者不存在",
      });
    }

    const participant = activity.participants[participantIndex];

    // 检查是否已签到
    if (!participant.checkinTime) {
      return res.status(400).json({
        success: false,
        message: "该参与者尚未签到",
      });
    }

    // 检查是否已经审核过
    if (participant.checkinStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "该签到已经审核过了",
      });
    }

    // 更新签到状态
    participant.checkinStatus = status as "approved" | "rejected";
    participant.checkinNote = note;

    // 如果签到审核通过，发放积分
    if (status === "approved") {
      const user = await User.findById(participant.user);
      if (user) {
        user.points += activity.points;
        await user.save();

        // 记录积分历史
        await PointsHistory.create({
          user: participant.user,
          points: activity.points,
          type: "earned",
          description: `参与活动: ${activity.title}`,
          relatedActivity: activity._id,
        });
      }
    }

    await activity.save();

    res.json({
      success: true,
      message: status === "approved" ? "已确认签到并发放积分" : "已拒绝签到",
    });
  } catch (error) {
    console.error("审核签到失败:", error);
    res.status(500).json({
      success: false,
      message: "审核签到失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 获取单个活动详情
export const getActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id)
      .populate("type", "name")
      .populate("createdBy", "username");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("获取活动详情失败:", error);
    res.status(500).json({
      success: false,
      message: "获取活动详情失败",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
};

// 计算两个坐标点之间的距离（单位：米）
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距离（米）
};

// 处理活动签到
export const checkInActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { latitude, longitude } = req.body;

    console.log("收到签到请求:", {
      activityId: id,
      userId: userId?.toString(),
      latitude,
      longitude,
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    // 验证活动是否存在
    const activity = await Activity.findById(id);
    if (!activity) {
      console.log("活动不存在:", id);
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    console.log("找到活动:", {
      title: activity.title,
      latitude: activity.latitude,
      longitude: activity.longitude,
    });

    // 验证用户是否已报名该活动
    const participant = activity.participants?.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "您尚未报名该活动",
      });
    }

    // 验证是否在签到时间范围内
    const now = new Date();
    const startTime = new Date(activity.startTime);
    const checkinEndTime = activity.checkinEndTime
      ? new Date(activity.checkinEndTime)
      : null;

    if (!checkinEndTime || now < startTime || now > checkinEndTime) {
      return res.status(403).json({
        success: false,
        message: "不在签到时间范围内",
      });
    }

    // 验证是否已经签到
    if (participant.checkinStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "您已经签到过了",
      });
    }

    // 验证位置是否在范围内
    if (!activity.latitude || !activity.longitude) {
      console.log("活动未设置签到位置");
      return res.status(400).json({
        success: false,
        message: "活动未设置签到位置",
      });
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      activity.latitude,
      activity.longitude
    );

    const maxDistance = req.body.isIPLocation ? 30000 : 30000; // 修改为30公里范围
    if (distance > maxDistance) {
      return res.status(400).json({
        success: false,
        message: `您距离活动地点${(distance / 1000).toFixed(
          2
        )}公里，超出签到范围（10公里）`, // 显示为10公里
      });
    }

    // 更新签到状态
    const updatedActivity = await Activity.findOneAndUpdate(
      {
        _id: id,
        "participants.user": userId,
      },
      {
        $set: {
          "participants.$.checkinStatus": "approved",
          "participants.$.checkinTime": new Date(),
          "participants.$.checkinLocation": {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
      { new: true }
    );

    if (!updatedActivity) {
      console.error("更新签到状态失败");
      return res.status(500).json({
        success: false,
        message: "签到失败，请重试",
      });
    }

    console.log("签到成功:", {
      activityId: id,
      userId: userId.toString(),
      checkinTime: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "签到成功",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("签到失败:", error);
    return res.status(500).json({
      success: false,
      message: "签到失败，请重试",
    });
  }
};

// 获取活动签到状态
export const getActivityCheckinStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "未登录",
      });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "活动不存在",
      });
    }

    const participant = activity.participants?.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "您尚未报名该活动",
      });
    }

    return res.json({
      success: true,
      data: {
        hasCheckin: participant.checkinStatus === "approved",
        checkinStatus: participant.checkinStatus,
        checkinTime: participant.checkinTime,
      },
    });
  } catch (error) {
    console.error("获取签到状态失败:", error);
    return res.status(500).json({
      success: false,
      message: "获取签到状态失败，请重试",
    });
  }
};

// 获取用户参加的所有活动（包含签到状态）
export const getJoinedActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "未授权的操作",
      });
    }

    const activities = await Activity.find({
      participants: { $elemMatch: { user: userId } },
    })
      .populate("type", "name")
      .populate("createdBy", "username");

    // 使用JSON序列化和反序列化处理MongoDB ObjectId，将其转换为字符串
    // 这样前端在比较用户ID时就不会有问题
    const processedActivities = JSON.parse(JSON.stringify(activities));

    // 额外检查确保所有参与者的user字段都是字符串
    processedActivities.forEach((activity: any) => {
      if (activity.participants && activity.participants.length > 0) {
        // 查找当前用户的参与者记录
        const currentUserParticipant = activity.participants.find(
          (p: any) => p.user === userId.toString()
        );
        // 如果找到，添加签到状态和时间到活动对象中
        if (currentUserParticipant) {
          activity.currentUserCheckinStatus =
            currentUserParticipant.checkinStatus;
          activity.currentUserCheckinTime = currentUserParticipant.checkinTime;
        }

        // 额外检查确保所有参与者的user字段都是字符串
        activity.participants.forEach((participant: any) => {
          if (participant.user && typeof participant.user !== "string") {
            participant.user = participant.user.toString();
          }
        });
      }
    });

    res.json({
      success: true,
      data: processedActivities,
    });
  } catch (error: any) {
    console.error("获取用户参加的所有活动失败:", error);
    res.status(500).json({
      success: false,
      message: "获取用户参加的所有活动失败",
      error: error.message,
    });
  }
};
