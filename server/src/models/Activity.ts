import mongoose, {
  Schema,
  Document,
  Model,
  CallbackWithoutResult,
} from "mongoose";
import { IUser } from "./User";

export interface IParticipant {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  joinTime: Date;
  note?: string;
  teamMembers?: Array<{
    name: string;
    studentId: string;
  }>;
  checkinStatus?: "pending" | "approved" | "rejected";
  checkinTime?: Date;
  checkinLocation?: {
    type: { type: string; default: null };
    coordinates: { type: number[]; default: null };
  };
  pointsAwarded?: boolean;
  checkinNote?: string;
}

export interface IActivity extends Document {
  title: string;
  description: string;
  points: number;
  startTime: Date;
  endTime: Date;
  registrationEndTime: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: "draft" | "published" | "cancelled" | "completed";
  image?: string;
  type: mongoose.Types.ObjectId;
  maxParticipants?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  participants: IParticipant[];
  isTeamActivity: boolean;
  checkinRequired: boolean;
  checkinEndTime?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  joinTime: { type: Date, default: Date.now },
  note: { type: String },
  teamMembers: [
    {
      name: { type: String },
      studentId: { type: String },
    },
  ],
  checkinStatus: { type: String, enum: ["pending", "approved", "rejected"] },
  checkinTime: { type: Date },
  checkinLocation: {
    _id: false,
    type: new Schema(
      {
        type: { type: String, default: null },
        coordinates: { type: [Number], default: null },
      },
      { _id: false }
    ),
  },
  pointsAwarded: { type: Boolean, default: false },
  checkinNote: { type: String },
});

const activitySchema = new Schema<IActivity>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: Schema.Types.ObjectId, ref: "ActivityType", required: true },
    points: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    registrationEndTime: { type: Date, required: true },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    image: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxParticipants: { type: Number },
    isTeamActivity: { type: Boolean, default: false },
    minTeamSize: { type: Number, min: 1, default: 1 },
    maxTeamSize: { type: Number, min: 1, default: 1 },
    participants: [participantSchema],
    checkinRequired: { type: Boolean, default: false },
    checkinEndTime: { type: Date },
  },
  {
    timestamps: true,
  }
);

// 添加验证：结束时间必须晚于开始时间
activitySchema.pre(
  "save",
  function (this: IActivity, next: CallbackWithoutResult) {
    // 只在创建新文档时进行时间验证
    if (this.isNew) {
      if (this.endTime <= this.startTime) {
        next(new Error("结束时间必须晚于开始时间"));
      } else if (this.registrationEndTime > this.startTime) {
        next(new Error("报名截止时间必须早于活动开始时间"));
      } else if (
        this.checkinRequired &&
        this.checkinEndTime &&
        this.checkinEndTime < this.startTime
      ) {
        next(new Error("签到截止时间必须晚于活动开始时间"));
      }
    }
    next(null);
  }
);

const Activity = mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;
