export interface User {
  id: string;
  username: string;
  email: string;
  studentId: string;
  role: 'admin' | 'user';
  points?: number;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  email: string;
  studentId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 商品相关类型
export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number; // 所需积分
  stock: number; // 库存数量
  status: 'active' | 'inactive';
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductForm {
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: File;
}

// 兑换记录相关类型
export interface Exchange {
  _id: string;
  user: {
    _id: string;
    username: string;
    email?: string;
    studentId?: string;
  };
  product: {
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
  quantity: number;
  pointsUsed: number;
  status: 'pending' | 'completed' | 'cancelled';
  exchangeTime: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// 分页相关类型
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 