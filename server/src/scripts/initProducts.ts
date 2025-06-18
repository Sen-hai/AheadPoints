import mongoose from "mongoose";
import Product from "../models/Product";
import User from "../models/User";
import connectDB from "../config/database";

const initProducts = async () => {
  try {
    await connectDB();
    
    // 查找管理员用户
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("请先创建管理员用户");
      process.exit(1);
    }

    // 清空现有商品
    await Product.deleteMany({});
    console.log("已清空现有商品数据");

    // 创建示例商品
    const sampleProducts = [
      {
        name: "精美笔记本",
        description: "高质量A5笔记本，适合记录学习心得和活动感悟",
        price: 50,
        stock: 20,
        status: "active",
        createdBy: admin._id,
      },
      {
        name: "定制水杯",
        description: "社团专属定制保温杯，容量500ml",
        price: 80,
        stock: 15,
        status: "active",
        createdBy: admin._id,
      },
      {
        name: "文具套装",
        description: "包含圆珠笔、铅笔、橡皮擦等常用文具",
        price: 30,
        stock: 25,
        status: "active",
        createdBy: admin._id,
      },
      {
        name: "社团徽章",
        description: "精美金属徽章，彰显社团身份",
        price: 20,
        stock: 50,
        status: "active",
        createdBy: admin._id,
      },
      {
        name: "活动T恤",
        description: "社团活动纪念T恤，多种尺码可选",
        price: 120,
        stock: 10,
        status: "active",
        createdBy: admin._id,
      },
      {
        name: "书签套装",
        description: "精美书签5件套，读书必备",
        price: 25,
        stock: 30,
        status: "active",
        createdBy: admin._id,
      },
    ];

    const products = await Product.insertMany(sampleProducts);
    console.log(`成功创建 ${products.length} 个示例商品:`);
    products.forEach((product) => {
      console.log(`- ${product.name}: ${product.price}积分 (库存: ${product.stock})`);
    });

    console.log("商品数据初始化完成！");
    process.exit(0);
  } catch (error) {
    console.error("初始化商品数据失败:", error);
    process.exit(1);
  }
};

initProducts(); 