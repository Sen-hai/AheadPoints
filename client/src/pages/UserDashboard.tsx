import React, { useState, useEffect } from 'react';
import { Card, Table, message, Row, Col, Statistic, Tabs, Tag, Image, Button, Space, Typography } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined, TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';
import './UserDashboard.css';
import CheckInButton from '../components/CheckInButton';

const { Text } = Typography;

interface PointsHistory {
  _id: string;
  points: number;
  description: string;
  createdAt: string;
}

interface UserInfo {
  username: string;
  email: string;
  studentId: string;
  points: number;
  role: string;
}

interface ActivityInfo {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  points: number;
  type?: { name: string };
  status: string;
  image?: string;
  checkinRequired?: boolean;
  checkinEndTime?: string;
  currentUserCheckinStatus?: "pending" | "approved" | "rejected";
  currentUserCheckinTime?: string;
  latitude?: number;
  longitude?: number;
}

const UserDashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<ActivityInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedActivitiesLoading, setJoinedActivitiesLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('请先登录');
      return;
    }
    fetchUserInfo();
    fetchPointsHistory();
    fetchJoinedActivities();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/user/info', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserInfo(response.data.data);
      } else {
        message.error(response.data.message || '获取用户信息失败');
      }
    } catch (error: unknown) {
      console.error('获取用户信息失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        message.error('获取用户信息失败');
      }
    }
  };

  const fetchPointsHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/user/points/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPointsHistory(response.data.data.history);
      } else {
        message.error(response.data.message || '获取积分历史失败');
      }
    } catch (error: unknown) {
      console.error('获取积分历史失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        message.error('获取积分历史失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedActivities = async () => {
    setJoinedActivitiesLoading(true);
    console.log('Fetching joined activities...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, returning.');
        return;
      }

      // 直接获取用户参加的活动列表
      const response = await axios.get('http://localhost:5000/api/activities/joined', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('Fetched activities:', response.data.data);
        setJoinedActivities(response.data.data);
      }
    } catch (error: any) {
      console.error('获取用户参加的所有活动失败:', error);
      message.error('获取活动列表失败');
    } finally {
      setJoinedActivitiesLoading(false);
    }
  };

  // 定义刷新单个活动状态的函数
  const refreshActivityStatus = async (activityId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setJoinedActivities(prev =>
          prev.map(activity =>
            activity._id === activityId ? response.data.data : activity
          )
        );
      }
    } catch (error) {
      console.error('刷新活动状态失败:', error);
    }
  };

  // 重新定义积分历史的列
  const columns = [
    {
      title: '积分变动',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => (
        <span style={{ color: points >= 0 ? '#52c41a' : '#f5222d' }}>
          {points >= 0 ? '+' : ''}{points}
        </span>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    }
  ];

  const activityColumns = [
    {
      title: '活动图片',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => image ? <Image src={`http://localhost:5000${image}`} width={50} /> : '无图片',
    },
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '活动描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span title={text}>{text ? `${text.substring(0, 20)}...` : '-'}</span>
    },
    {
      title: '活动时间',
      key: 'activityTime',
      render: (activity: ActivityInfo) => (
        <span>
          {new Date(activity.startTime).toLocaleString()} ~ {new Date(activity.endTime).toLocaleString()}
        </span>
      ),
    },
    {
      title: '报名截止时间',
      dataIndex: 'registrationEndTime',
      key: 'registrationEndTime',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '状态',
      key: 'status',
      render: (activity: ActivityInfo) => {
        const now = new Date();
        const isRegistrationEnded = now > new Date(activity.registrationEndTime);
        const isEnded = now > new Date(activity.endTime);

        if (activity.status === 'completed') {
          return <Tag color="success">已结束 (系统)</Tag>;
        } else if (isEnded) {
          return <Tag color="default">已结束</Tag>;
        } else if (isRegistrationEnded) {
          return <Tag color="orange">报名已截止</Tag>;
        } else if (activity.status === 'published') {
          return <Tag color="green">进行中</Tag>;
        } else {
          return <Tag color="default">{activity.status}</Tag>; // 显示其他状态如 draft, cancelled
        }
      },
    },
    // 新增操作列，用于签到
    {
      title: '操作',
      key: 'action',
      render: (text: any, activity: ActivityInfo) => {
        const now = new Date();
        const startTime = new Date(activity.startTime);
        const endTime = new Date(activity.endTime);
        const checkinEndTime = activity.checkinEndTime ? new Date(activity.checkinEndTime) : null;
        const hasCheckedIn = activity.currentUserCheckinStatus === 'approved';

        // 如果不需要签到，直接返回null
        if (!activity.checkinRequired) {
          return null;
        }

        // 如果已经签到成功，显示签到状态和时间
        if (hasCheckedIn) {
          return (
            <div>
              <Tag color="success">已签到</Tag>
              {activity.currentUserCheckinTime && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    签到时间：{new Date(activity.currentUserCheckinTime).toLocaleString()}
                  </Text>
                </div>
              )}
            </div>
          );
        }

        // 如果活动已结束且未签到
        if (now > endTime) {
          return <Tag color="error">未签到</Tag>;
        }

        // 如果在签到时间范围内
        if (now >= startTime && checkinEndTime && now <= checkinEndTime) {
          return (
            <CheckInButton
              activityId={String(activity._id)}
              checkinEndTime={activity.checkinEndTime || ''}
              onCheckInSuccess={() => refreshActivityStatus(activity._id)}
              isCheckedIn={hasCheckedIn}
            />
          );
        }

        // 如果活动还未开始
        if (now < startTime) {
          return <Tag color="default">活动未开始</Tag>;
        }

        // 如果超过签到时间
        if (checkinEndTime && now > checkinEndTime) {
          return <Tag color="warning">签到已截止</Tag>;
        }

        return null;
      },
    },
  ];

  // 处理签到逻辑
  const handleCheckin = async (activityId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/activities/${activityId}/checkin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        message.success('签到成功！');
        // 签到成功后刷新活动列表以更新签到状态
        fetchJoinedActivities();
      } else {
        message.error(response.data.message || '签到失败');
      }
    } catch (error: any) {
      console.error('签到失败:', error);
      message.error(error.response?.data?.message || '签到失败，请重试');
    }
  };

  return (
    <div className="user-dashboard-page">
      <div className="user-dashboard">
        <div className="dashboard-header">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card className="info-card">
                <Statistic
                  title="用户名"
                  value={userInfo?.username || '加载中...'}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="info-card">
                <Statistic
                  title="邮箱"
                  value={userInfo?.email || '加载中...'}
                  prefix={<MailOutlined />}
                  valueStyle={{ fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="info-card">
                <Statistic
                  title="学号"
                  value={userInfo?.studentId || '加载中...'}
                  prefix={<IdcardOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="info-card">
                <Statistic
                  title="当前积分"
                  value={userInfo?.points || 0}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </div>
        <Tabs defaultActiveKey="points" items={[
          {
            key: 'points',
            label: '积分历史',
            children: (
              <Card className="history-card" title={null} bordered={false} style={{ marginTop: 24 }}>
                <Table
                  columns={columns}
                  dataSource={pointsHistory}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`
                  }}
                />
              </Card>
            )
          },
          {
            key: 'activities',
            label: '我参加的活动',
            children: (
              <Card className="joined-activities-card" title={null} bordered={false} style={{ marginTop: 24 }}>
                {joinedActivities.length > 0 ? (
                  <Table
                    columns={activityColumns} // 使用包含签到操作的新列定义
                    dataSource={joinedActivities}
                    rowKey="_id"
                    loading={joinedActivitiesLoading}
                    pagination={{
                      pageSize: 5,
                      showTotal: (total) => `共 ${total} 条记录`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#aaa' }}>暂无参加的活动</div>
                )}
              </Card>
            )
          }
        ]} />
      </div>
    </div>
  );
};

export default UserDashboard;