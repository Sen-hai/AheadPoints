# 先锋积分管理系统

## 项目简介

本项目是一个面向校内社团活动的积分管理系统，支持活动报名、签到、积分统计与兑换、商品管理、轮播图管理等功能。系统采用前后端分离架构，前端基于 React + TypeScript + Ant Design，后端基于 Express + TypeScript + MongoDB（Mongoose），并集成高德地图API实现活动地理位置选点与签到。

---

## 技术栈

- **前端**：React 18、TypeScript、Vite、Ant Design 5、Axios、React Router DOM
- **后端**：Express 4、TypeScript、Mongoose 8、Sequelize、JWT、Multer
- **数据库**：MongoDB（主）、MySQL（部分兼容/扩展）
- **地图服务**：高德地图 JavaScript API
- **开发工具**：Vite、ESLint、ts-node、dotenv

---

## 主要功能

### 用户端
- 用户注册、登录、个人信息管理
- 浏览社团活动、报名、签到（基于高德地图定位）
- 积分获取与历史记录查询
- 积分兑换商品、兑换历史查询

### 管理端
- 活动管理（发布、编辑、审核、签到设置、地理位置选点）
- 用户管理（积分调整、信息维护）
- 商品管理（上架、下架、库存、图片上传）
- 轮播图管理
- 数据统计与导出

---

## 目录结构

```
先锋积分/
├── client/                  # 前端项目（React）
│   ├── src/
│   │   ├── api/             # 前端API封装
│   │   ├── components/      # 复用组件（如AmapPicker、CheckInButton等）
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── pages/           # 页面组件（活动、用户、管理等）
│   │   ├── types/           # TypeScript类型定义
│   │   └── assets/          # 静态资源
│   ├── public/              # 公共资源与高德API引入
│   └── package.json         # 前端依赖
├── server/                  # 后端项目（Express）
│   ├── src/
│   │   ├── config/          # 数据库与环境配置
│   │   ├── controllers/     # 业务控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型（Mongoose）
│   │   ├── routes/          # 路由定义
│   │   ├── scripts/         # 初始化脚本
│   │   └── types/           # 类型定义
│   └── package.json         # 后端依赖
└── README.md                # 项目说明文档
```

---

## 环境配置

### 前端

1. 进入 `client` 目录，安装依赖：
   ```bash
   cd client
   npm install
   ```

2. 配置环境变量（如需自定义API地址）：
   - 新建 `.env` 文件，内容示例：
     ```
     VITE_API_BASE_URL=http://localhost:5000/api
     ```

3. 启动前端开发服务器：
   ```bash
   npm run dev
   ```

### 后端

1. 进入 `server` 目录，安装依赖：
   ```bash
   cd server
   npm install
   ```

2. 配置环境变量（如需自定义MongoDB连接）：
   - 新建 `.env` 文件，内容示例：
     ```
     MONGODB_URI=mongodb://localhost:27017/projecttest
     JWT_SECRET=your_jwt_secret
     ```

3. 启动后端开发服务器：
   ```bash
   npm run dev
   ```

---

## 数据库设计（核心模型）

### 用户（User）
- username: 用户名
- password: 密码（加密）
- email: 邮箱
- studentId: 学号
- role: 用户角色（user/admin）
- points: 当前积分
- walletAddress: 区块链钱包地址（可选）
- joinedActivities: 参与活动列表

### 活动（Activity）
- title: 活动标题
- description: 活动描述
- type: 活动类型
- points: 积分
- startTime/endTime/registrationEndTime: 时间
- location/latitude/longitude: 地理位置
- status: 状态
- participants: 参与者及签到信息
- checkinRequired/checkinEndTime: 签到设置

### 商品（Product）
- name: 商品名
- description: 描述
- image: 图片
- price: 所需积分
- stock: 库存
- status: 状态

### 积分历史（PointsHistory）
- user: 用户
- points: 积分变动
- type: earned/spent
- description: 说明
- relatedActivity/relatedExchange: 关联活动/兑换

### 兑换记录（Exchange）
- user: 用户
- product: 商品
- quantity: 数量
- pointsUsed: 使用积分
- status: 状态
- exchangeTime: 时间

### 轮播图（Banner）
- url: 图片地址
- title: 标题
- order: 顺序
- isActive: 是否启用

---

## 高级特性与亮点

- **高德地图API集成**：支持活动地理位置选点与签到，提升活动真实性与互动性。
- **权限与安全**：JWT鉴权、密码加密、接口权限校验。
- **响应式UI**：Ant Design 5，兼容PC与移动端。
- **模块化设计**：前后端分离，代码结构清晰，易于扩展和维护。
- **丰富的管理功能**：支持活动、用户、商品、轮播图等多维度管理。
- **积分体系**：积分获取、消耗、兑换全流程闭环，支持积分历史追溯。
- **文件上传**：活动、商品、轮播图图片上传与管理。
- **数据统计**：支持用户、积分、活动等多维度统计与导出。

---

## 主要依赖

### 前端
- react, react-dom, react-router-dom
- antd, @ant-design/icons
- axios
- vite, typescript, eslint

### 后端
- express, mongoose, sequelize, mysql2
- jsonwebtoken, bcryptjs, multer, dotenv
- ts-node, typescript

---

## 部署与生产环境

1. 前后端分别构建：
   ```bash
   # 前端
   cd client
   npm run build

   # 后端
   cd server
   npm run build
   ```

2. 配置生产环境变量，启动服务（可用pm2、docker等方式）。

3. 前端可部署至静态服务器（如Nginx），后端部署Node服务并连接MongoDB。

---

## 贡献与开发

- 欢迎PR和Issue，建议先fork后开发。
- 代码风格遵循TypeScript最佳实践，前端建议使用函数组件和Hooks。
- 详细API文档与二次开发说明请见`/client/src/api`与`/server/src/routes`。

---

## 联系与支持

如有问题或建议，请通过GitHub Issue反馈，或联系项目维护者。

---

如需更详细的API接口文档、二次开发说明或部署脚本，可进一步补充。你可以直接将此README内容复制到项目根目录的`README.md`，即可用于GitHub展示。 