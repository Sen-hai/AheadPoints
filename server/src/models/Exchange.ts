import mongoose, { Document } from "mongoose";

export interface IExchange extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  quantity: number; // 兑换数量
  pointsUsed: number; // 使用的积分
  status: "pending" | "completed" | "cancelled"; // 兑换状态
  exchangeTime: Date;
  note?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

const exchangeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pointsUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    exchangeTime: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 添加索引
exchangeSchema.index({ user: 1, createdAt: -1 });
exchangeSchema.index({ product: 1 });
exchangeSchema.index({ status: 1 });
exchangeSchema.index({ exchangeTime: -1 });

const Exchange = mongoose.model<IExchange>("Exchange", exchangeSchema);

export default Exchange; 