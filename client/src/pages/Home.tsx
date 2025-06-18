import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-content">
          <div className="home-header">
            <h1>欢迎来到社团活动积分系统</h1>
            <p>参与社团活动，累积积分，提升自我</p>
          </div>
          <div className="home-features">
            <div className="feature-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/activities')}>
              <h3>丰富活动</h3>
              <p>各类社团活动等你参与</p>
            </div>
            <div className="feature-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
              <h3>积分兑换</h3>
              <p>参与活动获取的积分可兑换</p>
            </div>
            <div className="feature-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/user-dashboard')}>
              <h3>个人成长</h3>
              <p>记录你的活动历程</p>
            </div>
          </div>
          <div className="home-actions">
            {/* <Button
              type="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              立即开始
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 