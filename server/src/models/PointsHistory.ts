import mongoose, { Document } from "mongoose";

export interface IPointsHistory extends Document {
  user: mongoose.Types.ObjectId;
  points: number;
  type: "earned" | "spent";
  description: string;
  relatedActivity?: mongoose.Types.ObjectId;
  relatedExchange?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const pointsHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
    },
    relatedExchange: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

const PointsHistory = mongoose.model<IPointsHistory>(
  "PointsHistory",
  pointsHistorySchema
);

export default PointsHistory;
