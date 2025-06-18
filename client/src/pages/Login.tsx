import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, WalletOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

// 扩展 Window 接口以包含 ethereum
declare global {
  interface Window {
    ethereum?: any; // 使用 any 类型或者更具体的类型，如 ethers.Eip1193Provider
  }
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 检查用户是否已经登录  
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  // 监听用户名输入，判断是否是管理员
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAdmin(e.target.value === 'admin');
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 如果是管理员账户，不需要钱包地址
      const loginData = {
        ...values,
        walletAddress: isAdmin ? undefined : (walletAddress || undefined)
      };

      const response = await axios.post('http://localhost:5000/api/auth/login', loginData);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', response.data.user.role);

        authLogin(response.data.token, response.data.user);
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error(response.data.message || '登录失败，请检查您的用户名和密码');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      if (error.response && error.response.data) {
        const errorMsg = error.response.data.message;
        if (errorMsg.includes('钱包地址不匹配')) {
          message.error('钱包地址与注册时不符，请使用注册时的钱包');
        } else if (errorMsg.includes('用户名或密码错误')) {
          message.error('用户名或密码错误，请重试');
        } else {
          message.error(errorMsg || '登录失败，请重试');
        }
      } else {
        message.error('登录失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setWalletConnecting(true);
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // 请求用户授权访问其账户
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          message.success('钱包连接成功');
        } else {
          throw new Error('没有连接到钱包账户');
        }
      } else {
        throw new Error('未检测到以太坊钱包，请安装MetaMask');
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      message.error(error.message || '连接钱包失败');
    } finally {
      setWalletConnecting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">用户登录</h2>
        <Form
          form={form}
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入您的用户名!' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
              size="large"
              onChange={handleUsernameChange}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入您的密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          {!isAdmin && (
            <div className="wallet-connect-section">
              <div className="wallet-connect-title">连接钱包（可选）</div>
              <Button
                type="primary"
                onClick={connectWallet}
                className="wallet-connect-button"
                loading={walletConnecting}
                icon={<WalletOutlined />}
                size="large"
              >
                连接钱包
              </Button>

              {walletAddress && (
                <div className="wallet-status">
                  已连接钱包地址：
                  <div className="wallet-address">{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}</div>
                </div>
              )}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={loading}
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register" className="register-form-login">
            还没有账号？立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;