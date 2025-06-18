import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
  url: string;
  title?: string;
  order?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "轮播图",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBanner>("Banner", BannerSchema);
