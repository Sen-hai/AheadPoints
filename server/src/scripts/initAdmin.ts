import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import bcrypt from "bcryptjs";

dotenv.config();

const createAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/AheadPoints"
    );
    console.log("Connected to MongoDB");

    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin account already exists");
      process.exit(0);
    }

    // 创建管理员账户
    const adminUser = new User({
      username: "admin",
      password: "admin123", // 密码会在保存时自动加密
      email: "admin@example.com",
      studentId: "ADMIN001",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin account created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error);
    process.exit(1);
  }
};

createAdmin();
