"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const activities_1 = __importDefault(require("./routes/admin/activities"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// 连接数据库
(0, database_1.default)();
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 静态文件服务
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// 路由
app.use("/api/auth", auth_1.default);
app.use("/api/user", user_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/activities", activityRoutes_1.default);
app.use("/api/admin/activities", activities_1.default);
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "服务器内部错误！" });
});
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
