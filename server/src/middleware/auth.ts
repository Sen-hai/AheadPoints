import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { RequestHandler } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const auth: RequestHandler<
  any,
  any,
  any,
  any,
  { user?: IUser }
> = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new Error();
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "请先登录" });
  }
};

export const isAdmin: RequestHandler<
  any,
  any,
  any,
  any,
  { user?: IUser }
> = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw new Error("请先登录");
    }

    if (authReq.user.role !== "admin") {
      throw new Error("需要管理员权限");
    }

    next();
  } catch (error: any) {
    res.status(403).json({ message: error.message || "没有权限访问" });
  }
};
