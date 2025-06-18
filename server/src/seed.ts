import mongoose from "mongoose";
import ActivityType from "./models/ActivityType";
import User from "./models/User";
import dotenv from "dotenv";

dotenv.config();

// 连接数据库
mongoose
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
async function seedDatabase() {
  try {
    // 先检查是否有管理员用户
    let adminUser = await User.findOne({ role: "admin" });

    // 如果没有管理员用户，创建一个
    if (!adminUser) {
      adminUser = await User.create({
        username: "admin",
        email: "admin@example.com",
        password: "Admin123!",
        role: "admin",
        studentId: "admin001",
      });
      console.log("创建默认管理员用户成功");
    }

    // 新增：始终插入常用活动类型（避免重复）
    const commonTypes = [
      { name: "志愿活动", description: "志愿服务相关活动", basePoints: 10 },
      { name: "学习活动", description: "学习相关活动", basePoints: 5 },
      { name: "社团活动", description: "社团相关活动", basePoints: 8 },
      { name: "体育活动", description: "体育锻炼、比赛等", basePoints: 6 },
      { name: "文艺活动", description: "文艺演出、比赛等", basePoints: 7 },
    ];
    for (const type of commonTypes) {
      const exists = await ActivityType.findOne({ name: type.name });
      if (!exists) {
        await ActivityType.create({ ...type, createdBy: adminUser._id });
        console.log(`已添加活动类型: ${type.name}`);
      } else {
        console.log(`活动类型已存在: ${type.name}`);
      }
    }

    // 查询并显示所有活动类型
    const activityTypes = await ActivityType.find();
    console.log("当前活动类型:", activityTypes);

    process.exit(0);
  } catch (error) {
    console.error("初始化数据失败", error);
    process.exit(1);
  }
}
