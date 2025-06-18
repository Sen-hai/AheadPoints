import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, message, Spin, Empty, Row, Col, Input, Pagination } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, TrophyOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import './ActivityList.css';

interface Activity {
  _id: string;
  name: string;
  date: string;
  location: string;
  points: number;
  description: string;
}

const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [registeredActivities, setRegisteredActivities] = useState<string[]>([]);
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null);
  const pageSize = 8;

  useEffect(() => {
    fetchActivities();
    fetchRegisteredActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/activities');
      if (response.data.success) {
        setActivities(response.data.data);
      } else {
        message.error('获取活动列表失败');
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredActivities = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:5000/api/activities/registered', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // 保存已报名活动的ID列表
        const registeredIds = response.data.data.map((activity: any) => activity._id);
        console.log('已报名活动IDs:', registeredIds);
        setRegisteredActivities(registeredIds);
      }
    } catch (error) {
      console.error('获取已报名活动失败:', error);
    }
  };

  const handleRegister = async (activityId: string) => {
    // 如果已经报名，显示信息并退出
    if (registeredActivities.includes(activityId)) {
      message.info('您已经报名了该活动');
      return;
    }

    // 防止重复点击
    if (loadingActivityId === activityId) return;

    setLoadingActivityId(activityId);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/activities/${activityId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('报名成功！');

        // 立即更新本地状态，将该活动添加到已报名列表
        setRegisteredActivities(prev => [...prev, activityId]);

        // 刷新活动列表
        fetchActivities();
      } else {
        message.error(response.data.message || '报名失败，请重试');
      }
    } catch (error: any) {
      console.error('报名失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('报名失败，请稍后重试');
      }
    } finally {
      setLoadingActivityId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchText.toLowerCase()) ||
    activity.location.toLowerCase().includes(searchText.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="activity-list-container">
      <div className="activity-search">
        <Input
          placeholder="搜索活动名称或地点"
          prefix={<SearchOutlined />}
          onChange={e => handleSearch(e.target.value)}
          allowClear
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : filteredActivities.length === 0 ? (
        <Empty description="暂无活动" />
      ) : (
        <>
          <div className="activity-cards">
            {paginatedActivities.map(activity => {
              const isRegistered = registeredActivities.includes(activity._id);
              const isPastActivity = new Date(activity.date) < new Date();
              const isLoading = loadingActivityId === activity._id;

              return (
                <div key={activity._id} className="activity-card">
                  <div className="activity-card-title">{activity.name}</div>
                  <div className="activity-card-info">
                    <CalendarOutlined />
                    {new Date(activity.date).toLocaleString()}
                  </div>
                  <div className="activity-card-info">
                    <EnvironmentOutlined />
                    {activity.location}
                  </div>
                  <div className="activity-card-points">
                    <TrophyOutlined />
                    积分：{activity.points}
                  </div>
                  <div className="activity-card-footer">
                    <div className="activity-card-status">
                      {isRegistered ? (
                        <Tag color="success">已报名</Tag>
                      ) : isPastActivity ? (
                        <Tag>已结束</Tag>
                      ) : (
                        <Tag>未报名</Tag>
                      )}
                    </div>
                    <div className="activity-card-actions">
                      {isRegistered ? (
                        <Button disabled style={{ cursor: 'not-allowed' }}>
                          已报名
                        </Button>
                      ) : isPastActivity ? (
                        <Button disabled style={{ cursor: 'not-allowed' }}>
                          已结束
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleRegister(activity._id)}
                          loading={isLoading}
                        >
                          立即报名
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pagination-container">
            <Pagination
              current={currentPage}
              total={filteredActivities.length}
              pageSize={pageSize}
              onChange={page => setCurrentPage(page)}
              showTotal={(total) => `共 ${total} 条记录`}
              showQuickJumper
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityList; 