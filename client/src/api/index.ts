import axios from 'axios';
import type { ApiResponse, User, LoginForm, RegisterForm } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data: LoginForm) => api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),
  register: (data: RegisterForm) => api.post<ApiResponse>('/auth/register', data),
};

export const user = {
  getInfo: () => api.get<ApiResponse<User>>('/user/info'),
  updateInfo: (data: Partial<User>) => api.put<ApiResponse<User>>('/user/info', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put<ApiResponse>('/user/password', data),
};

export default api; 