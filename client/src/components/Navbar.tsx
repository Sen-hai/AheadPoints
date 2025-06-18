import React from 'react';
import { Menu, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="navbar">
      <div className="navbar-logo">
        社团活动积分系统
      </div>
      <Menu mode="horizontal" className="navbar-menu">
        <Menu.Item key="home" onClick={() => navigate('/')}>
          首页
        </Menu.Item>
        <Menu.Item key="activities">
          活动列表
        </Menu.Item>
        <Menu.Item key="points">
          积分排行
        </Menu.Item>
        <Menu.Item key="about">
          关于我们
        </Menu.Item>
      </Menu>
      <div className="navbar-auth">
        {user ? (
          <>
            <span className="welcome-text">欢迎, {user.username}</span>
            <Button type="link" onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')}>
              个人中心
            </Button>
            <Button onClick={handleLogout}>退出登录</Button>
          </>
        ) : (
          <Button type="primary" onClick={() => navigate('/login')}>
            登录
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar; 