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
const ActivityType_1 = __importDefault(require("./models/ActivityType"));
const User_1 = __importDefault(require("./models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 连接数据库
mongoose_1.default
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/points-system")
    .then(() => {
    console.log("MongoDB连接成功");
    seedDatabase();
})
    .catch((err) => {
    console.error("MongoDB连接失败", err);
    process.exit(1);
});
// 初始化默认活动类型
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 先检查是否有管理员用户
            let adminUser = yield User_1.default.findOne({ role: "admin" });
            // 如果没有管理员用户，创建一个
            if (!adminUser) {
                adminUser = yield User_1.default.create({
                    username: "admin",
                    email: "admin@example.com",
                    password: "Admin123!",
                    role: "admin",
                    studentId: "admin001",
                });
                console.log("创建默认管理员用户成功");
            }
            // 检查是否已经有活动类型
            const count = yield ActivityType_1.default.countDocuments();
            if (count === 0) {
                // 创建默认活动类型
                yield ActivityType_1.default.create({
                    name: "志愿活动",
                    description: "志愿服务相关活动",
                    basePoints: 10,
                    createdBy: adminUser._id,
                });
                yield ActivityType_1.default.create({
                    name: "学习活动",
                    description: "学习相关活动",
                    basePoints: 5,
                    createdBy: adminUser._id,
                });
                yield ActivityType_1.default.create({
                    name: "社团活动",
                    description: "社团相关活动",
                    basePoints: 8,
                    createdBy: adminUser._id,
                });
                console.log("默认活动类型创建成功");
            }
            else {
                console.log("活动类型已存在，跳过初始化");
            }
            // 查询并显示所有活动类型
            const activityTypes = yield ActivityType_1.default.find();
            console.log("当前活动类型:", activityTypes);
            process.exit(0);
        }
        catch (error) {
            console.error("初始化数据失败", error);
            process.exit(1);
        }
    });
}
