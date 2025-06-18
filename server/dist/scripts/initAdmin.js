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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const createAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 连接数据库
        yield mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/AheadPoints");
        console.log("Connected to MongoDB");
        // 检查是否已存在管理员账户
        const existingAdmin = yield User_1.default.findOne({ username: "admin" });
        if (existingAdmin) {
            console.log("Admin account already exists");
            process.exit(0);
        }
        // 创建管理员账户
        const adminUser = new User_1.default({
            username: "admin",
            password: "admin123", // 密码会在保存时自动加密
            email: "admin@example.com",
            studentId: "ADMIN001",
            role: "admin",
        });
        yield adminUser.save();
        console.log("Admin account created successfully");
        console.log("Username: admin");
        console.log("Password: admin123");
        process.exit(0);
    }
    catch (error) {
        console.error("Error creating admin account:", error);
        process.exit(1);
    }
});
createAdmin();
