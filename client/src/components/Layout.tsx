import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ShopOutlined,
  HistoryOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import './Layout.css';

const { Header, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    }
  ];

  // 只有普通用户才显示活动列表和积分商城
  if (user.role !== 'admin' && user.username) {
    menuItems.push(
      {
        key: '/activities',
        icon: <CalendarOutlined />,
        label: '活动列表'
      },
      {
        key: '/products',
        icon: <ShopOutlined />,
        label: '积分商城'
      },
      {
        key: '/exchange-history',
        icon: <HistoryOutlined />,
        label: '兑换记录'
      }
    );
  }

  // 根据用户角色显示不同的菜单项
  if (user.role === 'admin') {
    menuItems.push({
      key: '/admin-dashboard',
      icon: <DashboardOutlined />,
      label: '管理控制台'
    });
  } else if (user.username) {
    menuItems.push(
      {
        key: '/user-dashboard',
        icon: <DashboardOutlined />,
        label: '用户仪表盘'
      },
      {
        key: '/user-center',
        icon: <UserOutlined />,
        label: '个人中心'
      }
    );
  }

  return (
    <Layout className="main-layout">
      <Header className="header site-header">
        <div className="logo">社团活动积分系统</div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="nav-menu custom-nav-menu"
        />
        {user.username ? (
          <div className="user-info">
            <span>{user.username}</span>
            <LogoutOutlined onClick={handleLogout} className="logout-icon" />
          </div>
        ) : (
          <div className="user-info">
            <span onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>登录</span>
            <span onClick={() => navigate('/register')} style={{ cursor: 'pointer', marginLeft: '15px' }}>注册</span>
          </div>
        )}
      </Header>
      <Content className="content main-content">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;