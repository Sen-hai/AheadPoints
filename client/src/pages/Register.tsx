import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, WalletOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import './Register.css';

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const registerData = {
        ...values,
        walletAddress: walletAddress || undefined
      };

      const response = await axios.post('http://localhost:5000/api/auth/register', registerData);

      if (response.data.success) {
        message.success('注册成功！正在跳转到登录页面...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        message.error(response.data.message || '注册失败，请重试');
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      if (error.response && error.response.data) {
        message.error(error.response.data.message || '注册失败，请重试');
      } else {
        message.error('注册失败，请检查网络连接');
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
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">用户注册</h2>
        <Form
          form={form}
          name="register"
          className="register-form"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="studentId"
            rules={[
              { required: true, message: '请输入学号!' },
              { pattern: /^\d+$/, message: '学号只能包含数字!' }
            ]}
          >
            <Input
              prefix={<IdcardOutlined className="site-form-item-icon" />}
              placeholder="学号"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>

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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="register-form-button"
              loading={loading}
              size="large"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" className="register-form-login">
            已有账号？立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 