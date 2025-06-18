import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Avatar } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import axios, { AxiosError } from 'axios';
import './UserCenter.css';

interface UserInfo {
  username: string;
  email: string;
  studentId: string;
  points: number;
  role: string;
  joinedActivities?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  message: string;
}

const UserCenter: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.get<ApiResponse<UserInfo>>('http://localhost:5000/api/user/info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUserInfo(response.data.data);
        form.setFieldsValue(response.data.data);
      } else {
        message.error(response.data.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      const axiosError = error as AxiosError<ApiError>;
      message.error(axiosError.response?.data?.message || '获取用户信息失败，请稍后重试');
    }
  };

  const handleSubmit = async (values: Partial<UserInfo>) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.put<ApiResponse<UserInfo>>('http://localhost:5000/api/user/info', values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        message.success('个人信息更新成功');
        fetchUserInfo();
      } else {
        message.error(response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      const axiosError = error as AxiosError<ApiError>;
      message.error(axiosError.response?.data?.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-center-page">
      <div className="user-center">
        <Card className="user-card">
          <div className="user-header">
            <Avatar size={64} icon={<UserOutlined />} />
            <h2>{userInfo?.username || '用户中心'}</h2>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="user-form"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="studentId"
              label="学号"
              rules={[{ required: true, message: '请输入学号' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="请输入学号" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default UserCenter; 