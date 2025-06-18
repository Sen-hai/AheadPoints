"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const activitySchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ActivityType",
        required: true,
    },
    points: {
        type: Number,
        required: true,
        min: 0,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    registrationEndTime: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
    },
    status: {
        type: String,
        enum: ["draft", "published", "cancelled"],
        default: "draft",
    },
    image: {
        type: String,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    maxParticipants: {
        type: Number,
        min: 0,
    },
    participants: [
        {
            user: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "User",
            },
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending",
            },
            joinTime: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    },
});
// 添加验证：结束时间必须晚于开始时间
activitySchema.pre("save", function (next) {
    if (this.endTime <= this.startTime) {
        next(new Error("结束时间必须晚于开始时间"));
    }
    if (this.registrationEndTime > this.endTime) {
        next(new Error("报名截止时间不能晚于活动结束时间"));
    }
    if (this.registrationEndTime < new Date()) {
        next(new Error("报名截止时间不能早于当前时间"));
    }
    next();
});
const Activity = mongoose_1.default.model("Activity", activitySchema);
exports.default = Activity;
