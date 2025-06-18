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
exports.getActivity = exports.approveParticipant = exports.getActivityParticipants = exports.joinActivity = exports.updateActivityStatus = exports.deleteActivity = exports.getActivities = exports.createActivity = exports.getActivityTypes = exports.createActivityType = exports.upload = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
const ActivityType_1 = __importDefault(require("../models/ActivityType"));
const User_1 = __importDefault(require("../models/User"));
const PointsHistory_1 = __importDefault(require("../models/PointsHistory"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
// 配置文件上传
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/activities";
        // 确保上传目录存在
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error("只允许上传jpg/jpeg/png格式的图片！"));
        }
    },
});
// 创建活动类型
const createActivityType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        const activityType = yield ActivityType_1.default.create({
            name,
            description,
        });
        res.status(201).json(activityType);
    }
    catch (error) {
        if (error.code === 11000) {
            // MongoDB 重复键错误
            return res.status(400).json({ message: "该活动类型名称已存在" });
        }
        res.status(500).json({ message: "创建活动类型失败", error: error.message });
    }
});
exports.createActivityType = createActivityType;
// 获取所有活动类型
const getActivityTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activityTypes = yield ActivityType_1.default.find().sort({ createdAt: -1 });
        res.json(activityTypes);
    }
    catch (error) {
        res.status(500).json({ message: "获取活动类型失败", error: error.message });
    }
});
exports.getActivityTypes = getActivityTypes;
// 创建活动
const createActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, points, startTime, endTime, registrationEndTime, type, status, location, maxParticipants, } = req.body;
        // 验证活动类型是否存在
        const activityType = yield ActivityType_1.default.findById(type);
        if (!activityType) {
            return res.status(400).json({
                success: false,
                message: "活动类型不存在",
            });
        }
        const image = req.file
            ? "/uploads/activities/" + req.file.filename
            : undefined;
        // 获取当前用户ID（从auth中间件设置）
        const createdBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: "未授权的操作",
            });
        }
        const activity = new Activity_1.default({
            title,
            description,
            points: Number(points),
            startTime,
            endTime,
            registrationEndTime: registrationEndTime || endTime, // 如果未指定报名截止时间，则默认为活动结束时间
            type,
            status: status || "draft",
            location,
            maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
            image,
            createdBy,
        });
        yield activity.save();
        yield activity.populate([
            { path: "type", select: "name" },
            { path: "createdBy", select: "username" },
        ]);
        res.json({
            success: true,
            data: activity,
            message: "活动创建成功",
        });
    }
    catch (error) {
        console.error("创建活动失败:", error);
        res.status(500).json({
            success: false,
            message: "创建活动失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.createActivity = createActivity;
// 获取所有活动
const getActivities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, type, startDate, endDate, showAll } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (startDate && endDate) {
            query.startTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        // 默认只返回报名期限内的活动，除非明确指定showAll=true
        if (showAll !== "true") {
            query.registrationEndTime = { $gte: new Date() };
            query.status = "published"; // 只显示已发布的活动
        }
        const activities = yield Activity_1.default.find(query)
            .sort({ startTime: -1 })
            .populate("type", "name")
            .populate("createdBy", "username");
        // 使用JSON序列化和反序列化处理MongoDB ObjectId，将其转换为字符串
        // 这样前端在比较用户ID时就不会有问题
        const processedActivities = JSON.parse(JSON.stringify(activities));
        // 额外检查确保所有参与者的user字段都是字符串
        processedActivities.forEach((activity) => {
            if (activity.participants && activity.participants.length > 0) {
                activity.participants.forEach((participant) => {
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
    }
    catch (error) {
        console.error("获取活动列表失败:", error);
        res.status(500).json({
            success: false,
            message: "获取活动列表失败",
            error: error.message,
        });
    }
});
exports.getActivities = getActivities;
// 删除活动
const deleteActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const activity = yield Activity_1.default.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "活动不存在",
            });
        }
        // 如果有图片，删除图片文件
        if (activity.image) {
            const imagePath = path_1.default.join(__dirname, "../../", activity.image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        yield activity.deleteOne();
        res.json({
            success: true,
            message: "活动删除成功",
        });
    }
    catch (error) {
        console.error("删除活动失败:", error);
        res.status(500).json({
            success: false,
            message: "删除活动失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.deleteActivity = deleteActivity;
// 更新活动状态
const updateActivityStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "请先登录" });
        }
        const { id } = req.params;
        const { status } = req.body;
        const activity = yield Activity_1.default.findById(id);
        if (!activity) {
            return res.status(404).json({ message: "活动不存在" });
        }
        // 检查是否是创建者或管理员
        if (activity.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin") {
            return res.status(403).json({ message: "没有权限更新此活动" });
        }
        activity.status = status;
        yield activity.save();
        yield activity.populate(["type", "createdBy"]);
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ message: "更新活动状态失败", error: error.message });
    }
});
exports.updateActivityStatus = updateActivityStatus;
// 用户报名活动
const joinActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "请先登录",
            });
        }
        // 查找活动
        const activity = yield Activity_1.default.findById(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "活动不存在",
            });
        }
        // 检查活动状态
        if (activity.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "该活动尚未发布或已取消",
            });
        }
        // 检查活动是否已结束
        if (new Date(activity.endTime) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "该活动已结束，无法报名",
            });
        }
        // 检查报名是否已截止
        if (new Date(activity.registrationEndTime) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "该活动报名已截止",
            });
        }
        // 检查用户是否已报名
        console.log("检查用户报名状态 - 用户ID:", userId.toString());
        console.log("参与者列表:", (_b = activity.participants) === null || _b === void 0 ? void 0 : _b.map((p) => ({
            userId: p.user.toString(),
            status: p.status,
        })));
        const existingParticipant = (_c = activity.participants) === null || _c === void 0 ? void 0 : _c.find((p) => p.user.toString() === userId.toString());
        console.log("是否找到已存在的参与记录:", !!existingParticipant);
        if (existingParticipant) {
            return res.status(400).json({
                success: false,
                message: "您已报名该活动",
            });
        }
        // 检查是否达到人数上限
        if (activity.maxParticipants &&
            activity.participants &&
            activity.participants.length >= activity.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: "该活动报名人数已达上限",
            });
        }
        // 添加用户到参与者列表
        if (!activity.participants) {
            activity.participants = [];
        }
        activity.participants.push({
            user: new mongoose_1.default.Types.ObjectId(userId),
            status: "pending",
            joinTime: new Date(),
        });
        yield activity.save();
        res.json({
            success: true,
            message: "报名成功，请等待审核",
        });
    }
    catch (error) {
        console.error("报名活动失败:", error);
        res.status(500).json({
            success: false,
            message: "报名活动失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.joinActivity = joinActivity;
// 获取活动参与者
const getActivityParticipants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // 查找活动并填充用户信息
        const activity = yield Activity_1.default.findById(id).populate({
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
    }
    catch (error) {
        console.error("获取活动参与者失败:", error);
        res.status(500).json({
            success: false,
            message: "获取活动参与者失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.getActivityParticipants = getActivityParticipants;
// 审核活动参与者
const approveParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const activity = yield Activity_1.default.findById(activityId);
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
        const participantIndex = activity.participants.findIndex((p) => p._id && p._id.toString() === participantId);
        if (participantIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "该参与者不存在",
            });
        }
        const participant = activity.participants[participantIndex];
        // 更新状态
        participant.status = status;
        // 如果审核通过，授予积分
        if (status === "approved") {
            const user = yield User_1.default.findById(participant.user);
            if (user) {
                user.points += activity.points;
                yield user.save();
                // 记录积分历史
                yield PointsHistory_1.default.create({
                    user: participant.user,
                    points: activity.points,
                    type: "earned",
                    description: `参与活动: ${activity.title}`,
                    relatedActivity: activity._id,
                });
            }
        }
        yield activity.save();
        res.json({
            success: true,
            message: status === "approved" ? "已批准参与者" : "已拒绝参与者",
        });
    }
    catch (error) {
        console.error("审核参与者失败:", error);
        res.status(500).json({
            success: false,
            message: "审核参与者失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.approveParticipant = approveParticipant;
// 获取单个活动详情
const getActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const activity = yield Activity_1.default.findById(id)
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
    }
    catch (error) {
        console.error("获取活动详情失败:", error);
        res.status(500).json({
            success: false,
            message: "获取活动详情失败",
            error: error instanceof Error ? error.message : "未知错误",
        });
    }
});
exports.getActivity = getActivity;
