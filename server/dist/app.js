"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const activities_1 = __importDefault(require("./routes/admin/activities"));
const banner_1 = __importDefault(require("./routes/banner"));
const app = (0, express_1.default)();
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
app.use("/api/banners", banner_1.default);
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "服务器内部错误",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
exports.default = app;
