"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pointsHistorySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ["earned", "spent"],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    relatedActivity: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Activity",
    },
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    },
});
const PointsHistory = mongoose_1.default.model("PointsHistory", pointsHistorySchema);
exports.default = PointsHistory;
