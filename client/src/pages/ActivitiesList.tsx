import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  message,
  Modal,
  Empty,
  Spin,
  Typography,
  Space,
  Input,
  Carousel,
  Pagination,
  Form,
  InputNumber,
  Alert
} from 'antd';
import { CalendarOutlined, EnvironmentOutlined, TrophyOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import './ActivitiesList.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 示例轮播图图片，实际项目中应该从后端获取
const bannerImages = [
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
];

interface Activity {
  _id: string;
  title: string;
  description: string;
  points: number;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  location?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  image?: string;
  type: {
    _id: string;
    name: string;
  };
  maxParticipants?: number;
  participants?: Array<{
    user: string;
    status: 'pending' | 'approved' | 'rejected';
    joinTime?: Date;
    teamMembers?: Array<any>;
  }>;
  isTeamActivity: boolean;
  checkinRequired: boolean;
  checkinStartTime: string;
  checkinEndTime: string;
}

interface Banner {
  _id: string;
  url: string;
  title?: string;
  createdAt: string;
}

const ActivitiesList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | undefined>(undefined);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const pageSize = 8;
  const [checkinStatus, setCheckinStatus] = useState<any>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 计算两个坐标点之间的距离（单位：米）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 返回距离（米）
  };

  useEffect(() => {
    fetchActivities();
    fetchBanners();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const now = new Date();
    const openActivities = activities.filter(activity => new Date(activity.registrationEndTime) > now);
    if (!searchText) {
      setFilteredActivities(openActivities);
    } else {
      const filtered = openActivities.filter(activity =>
        activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (activity.location && activity.location.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredActivities(filtered);
    }
    setCurrentPage(1);
  }, [activities, searchText]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/activities?showAll=true', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('获取活动列表成功:', response.data.data);
        setActivities(response.data.data);
        setFilteredActivities(response.data.data);
      } else {
        message.error(response.data.message || '获取活动列表失败');
      }
    } catch (error: any) {
      console.error('获取活动列表失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('获取活动列表失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const response = await axios.get('http://localhost:5000/api/banners');

      if (response.data.success) {
        setBanners(response.data.data);
      } else {
        console.error('获取轮播图失败:', response.data.message);
      }
    } catch (error) {
      console.error('获取轮播图失败:', error);
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/user/info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserInfo(response.data.data);
      }
    } catch (e) { /* 忽略 */ }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinActivity = async (activityId: string) => {
    const activity = activities.find(a => a._id === activityId);
    if (!activity) {
      message.error('活动不存在');
      return;
    }

    if (isUserJoined(activity)) {
      message.info('您已经报名过这个活动了');
      return;
    }

    try {
      setJoining(activityId);

      // 获取当前用户
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        message.error('请先登录');
        return;
      }
      const currentUser = JSON.parse(userStr);

      const response = await axios.post(
        `http://localhost:5000/api/activities/${activityId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // 更新本地活动状态
        const updatedActivities = activities.map(act => {
          if (act._id === activityId) {
            return {
              ...act,
              participants: [
                ...(act.participants || []),
                {
                  user: currentUser._id,
                  status: 'approved' as const,
                  joinTime: new Date(),
                  teamMembers: []
                }
              ]
            };
          }
          return act;
        });
        setActivities(updatedActivities);

        // 同时更新过滤后的活动列表
        const updatedFilteredActivities = filteredActivities.map(act => {
          if (act._id === activityId) {
            return {
              ...act,
              participants: [
                ...(act.participants || []),
                {
                  user: currentUser._id,
                  status: 'approved' as const,
                  joinTime: new Date(),
                  teamMembers: []
                }
              ]
            };
          }
          return act;
        });
        setFilteredActivities(updatedFilteredActivities);

        await fetchUserInfo();
        message.success('报名成功！');
      }
    } catch (error: any) {
      console.error('报名失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('报名失败，请重试');
      }
    } finally {
      setJoining(undefined);
    }
  };

  const showActivityDetails = (activity: Activity) => {
    setCurrentActivity(activity);
    setModalVisible(true);
  };

  const renderActivityStatus = (activity: Activity) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const now = new Date();

    // 1. 检查用户是否登录
    if (!currentUser._id) {
      // 用户未登录，只显示活动的时间状态
      if (new Date(activity.endTime) < now) {
        return <Tag color="default">已结束</Tag>;
      } else if (new Date(activity.registrationEndTime) < now) {
        return <Tag color="default">报名已截止</Tag>;
      } else {
        return <Tag color="blue">可报名</Tag>;
      }
    }

    // 用户已登录，检查是否已报名
    const currentUserId = String(currentUser._id);
    // 使用 find 方法查找参与者，并检查状态，假设 approved 表示正式报名
    const participant = activity.participants?.find(p => String(p.user) === currentUserId);

    if (participant) {
      // 用户是参与者，显示其参与状态或"已报名"
      if (participant.status === 'approved') {
        // TODO: 可以进一步细分签到状态，但当前简化为已报名
        return <Tag color="success">已报名</Tag>; // 或显示签到状态等
      } else if (participant.status === 'pending') {
        return <Tag color="processing">待审核</Tag>;
      } else if (participant.status === 'rejected') {
        return <Tag color="error">已拒绝</Tag>;
      } else {
        return <Tag color="success">已报名</Tag>; // 默认或未知状态按已报名处理
      }
    } else {
      // 用户未报名，显示基于时间的状态
      if (new Date(activity.endTime) < now) {
        return <Tag color="default">已结束</Tag>;
      } else if (new Date(activity.registrationEndTime) < now) {
        return <Tag color="default">报名已截止</Tag>;
      } else {
        return <Tag color="blue">可报名</Tag>;
      }
    }
  };

  const isUserJoined = (activity: Activity): boolean => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    const currentUser = JSON.parse(userStr);
    if (!currentUser._id) return false;

    const currentUserId = currentUser._id.toString();
    return activity.participants?.some(
      participant =>
        participant.user.toString() === currentUserId &&
        (participant.status === 'approved' || participant.status === 'pending')
    ) || false;
  };

  const handleCheckin = async (activityId: string) => {
    try {
      setCheckinLoading(true);

      // 获取地理位置
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // 先获取活动位置信息
      const activityResponse = await axios.get(
        `http://localhost:5000/api/activities/${activityId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (!activityResponse.data.success) {
        throw new Error('获取活动信息失败');
      }

      const activity = activityResponse.data.data;

      // 计算距离
      if (activity.latitude && activity.longitude) {
        const distance = calculateDistance(
          latitude,
          longitude,
          activity.latitude,
          activity.longitude
        );

        // 如果距离超过10公里，直接返回错误
        if (distance > 30000) {  // 实际限制30公里
          message.error(`您距离活动地点${(distance / 1000).toFixed(2)}公里，超出签到范围（10公里）`);
          setCheckinLoading(false);
          return;
        }
      }

      const response = await axios.post(
        `http://localhost:5000/api/activities/${activityId}/checkin`,
        { latitude, longitude },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        message.success('签到成功！');
        fetchCheckinStatus(activityId);
      } else {
        message.error(response.data.message || '签到失败');
      }
    } catch (error: any) {
      if (error.name === 'GeolocationPositionError') {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message.error('请允许获取位置信息以进行签到');
            break;
          case error.POSITION_UNAVAILABLE:
            message.error('无法获取当前位置');
            break;
          case error.TIMEOUT:
            message.error('获取位置信息超时');
            break;
          default:
            message.error('获取位置信息失败');
        }
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        console.error('签到失败:', error);
        message.error('签到失败，请检查网络连接或重试');
      }
    } finally {
      setCheckinLoading(false);
    }
  };

  const fetchCheckinStatus = async (activityId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/activities/${activityId}/checkin`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setCheckinStatus(response.data.data);
      }
    } catch (error) {
      console.error('获取签到状态失败:', error);
    }
  };

  const renderCheckinButton = (activity: Activity) => {
    if (!activity.checkinRequired) return null;

    const now = new Date();
    const isCheckinTime = now >= new Date(activity.checkinStartTime) &&
      now <= new Date(activity.checkinEndTime);

    // 如果不在签到时间范围内，显示提示信息
    if (!isCheckinTime) {
      return (
        <div className="checkin-info">
          <Text type="secondary">
            签到时间：{new Date(activity.checkinStartTime).toLocaleString()} - {new Date(activity.checkinEndTime).toLocaleString()}
          </Text>
        </div>
      );
    }

    // 如果在签到时间范围内，显示签到按钮
    return (
      <div className="checkin-section">
        <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
          签到时间：{new Date(activity.checkinStartTime).toLocaleString()} - {new Date(activity.checkinEndTime).toLocaleString()}
        </Text>
        <Button
          type="primary"
          loading={checkinLoading}
          onClick={() => handleCheckin(activity._id)}
          disabled={checkinStatus?.hasCheckin}
        >
          {checkinStatus?.hasCheckin ? '已签到' : '签到'}
        </Button>
        {checkinStatus?.hasCheckin && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              签到时间：{new Date(checkinStatus.checkinTime).toLocaleString()}
            </Text>
            <div style={{ marginTop: 4 }}>
              {renderCheckinStatusTag(checkinStatus.checkinStatus)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckinStatusTag = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">已确认</Tag>;
      case 'rejected':
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag color="warning">待审核</Tag>;
    }
  };

  const renderActivityModal = () => {
    if (!currentActivity) return null;

    const [form] = Form.useForm();
    const [participantCount, setParticipantCount] = useState(1);
    const [teamMembers, setTeamMembers] = useState<{ name: string; studentId: string }[]>([]);

    const isJoining = joining === currentActivity._id;
    const hasJoined = isUserJoined(currentActivity);
    const isPastRegistrationEndTime = new Date(currentActivity.registrationEndTime) < new Date();
    const isPastEndTime = new Date(currentActivity.endTime) < new Date();
    const isDisabled = hasJoined || isPastRegistrationEndTime || isPastEndTime;
    const isTeamActivity = currentActivity.isTeamActivity;

    const handleSubmit = async (values: any) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('请先登录');
          return;
        }

        const registrationData = {
          ...values,
          participantCount,
          teamMembers: isTeamActivity ? teamMembers : undefined,
        };

        const response = await axios.post(
          `http://localhost:5000/api/activities/${currentActivity._id}/join`,
          registrationData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          message.success('报名成功！');
          setModalVisible(false);
          fetchActivities();
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || '报名失败，请重试');
      }
    };

    const handleParticipantCountChange = (value: number | null) => {
      if (value === null) return;
      setParticipantCount(value);
      if (isTeamActivity) {
        setTeamMembers(Array(value - 1).fill({ name: '', studentId: '' }));
      }
    };

    return (
      <Modal
        title={currentActivity.title}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setParticipantCount(1);
          setTeamMembers([]);
        }}
        footer={null}
        width={800}
      >
        <div className="activity-details">
          {currentActivity.image ? (
            <div className="activity-image">
              <img
                src={currentActivity.image.startsWith('http') ? currentActivity.image : `http://localhost:5000${currentActivity.image}`}
                alt={currentActivity.title}
                style={{ height: 180, objectFit: 'cover' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default-activity.jpg';
                  console.log('图片加载失败，使用默认图片');
                }}
              />
            </div>
          ) : (
            <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarOutlined style={{ fontSize: 40, color: '#999' }} />
            </div>
          )}

          <div className="activity-info">
            <Space direction="vertical" size={16}>
              <Paragraph>{currentActivity.description}</Paragraph>

              <div>
                <Text strong>活动类型: </Text>
                <Tag color="blue">{currentActivity.type.name}</Tag>
              </div>

              <div>
                <Text strong>活动积分: </Text>
                <Text>{currentActivity.points}</Text>
              </div>

              <div>
                <Text strong>开始时间: </Text>
                <Text>{new Date(currentActivity.startTime).toLocaleString()}</Text>
              </div>

              <div>
                <Text strong>结束时间: </Text>
                <Text>{new Date(currentActivity.endTime).toLocaleString()}</Text>
              </div>

              <div>
                <Text strong>报名截止时间: </Text>
                <Text>{new Date(currentActivity.registrationEndTime).toLocaleString()}</Text>
              </div>

              {currentActivity.location && (
                <div>
                  <Text strong>活动地点: </Text>
                  <Text>{currentActivity.location}</Text>
                </div>
              )}

              {currentActivity.maxParticipants && (
                <div>
                  <Text strong>最大参与人数: </Text>
                  <Text>{currentActivity.maxParticipants}</Text>
                </div>
              )}

              <div>
                <Text strong>活动状态: </Text>
                {renderActivityStatus(currentActivity)}
              </div>

              {!isDisabled && (
                <Form
                  form={form}
                  onFinish={handleSubmit}
                  layout="vertical"
                  initialValues={{
                    participantCount: 1,
                    note: '',
                  }}
                >
                  <Form.Item
                    name="participantCount"
                    label="参与人数"
                    rules={[{ required: true, message: '请选择参与人数' }]}
                  >
                    <InputNumber
                      min={1}
                      max={currentActivity.maxParticipants || 1}
                      onChange={handleParticipantCountChange}
                    />
                  </Form.Item>

                  {isTeamActivity && participantCount > 1 && (
                    <div className="team-members">
                      <Typography.Title level={5}>团队成员信息</Typography.Title>
                      {teamMembers.map((_, index) => (
                        <div key={index} className="team-member">
                          <Form.Item
                            name={['teamMembers', index, 'name']}
                            label={`成员${index + 2}姓名`}
                            rules={[{ required: true, message: '请输入成员姓名' }]}
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={['teamMembers', index, 'studentId']}
                            label={`成员${index + 2}学号`}
                            rules={[{ required: true, message: '请输入成员学号' }]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                      ))}
                    </div>
                  )}

                  <Form.Item
                    name="note"
                    label="备注信息"
                  >
                    <Input.TextArea
                      placeholder="请填写其他需要说明的信息"
                      rows={4}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isJoining}>
                      确认报名
                    </Button>
                  </Form.Item>
                </Form>
              )}

              {currentActivity.checkinRequired && (
                <div>
                  <Text strong>签到信息: </Text>
                  {renderCheckinButton(currentActivity)}
                </div>
              )}
            </Space>
          </div>
        </div>
      </Modal>
    );
  };

  // 渲染活动卡片时根据状态变灰
  const getActivityCardClass = (activity: Activity) => {
    const now = new Date();
    if (now > new Date(activity.endTime) || now > new Date(activity.registrationEndTime)) {
      return 'activity-card activity-card-disabled';
    }
    return 'activity-card';
  };

  // 当前页的活动
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="activities-page">
      <div className="activities-list-container">
        {/* 轮播图区域 */}
        <div className="activities-banner">
          {bannersLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" tip="加载轮播图..." />
            </div>
          ) : banners.length > 0 ? (
            <Carousel autoplay effect="fade">
              {banners.map(banner => (
                <div key={banner._id}>
                  <img src={banner.url} alt={banner.title || '活动轮播图'} />
                </div>
              ))}
            </Carousel>
          ) : (
            <Carousel autoplay>
              {bannerImages.map((image, index) => (
                <div key={index}>
                  <img src={image} alt="活动轮播图" />
                </div>
              ))}
            </Carousel>
          )}
        </div>

        {/* 标题区域 */}
        <div className="activities-header">
          <Title level={2}>探索精彩活动</Title>
          <Text>参与社团活动，积累成长经验</Text>
        </div>

        {/* 搜索区域 */}
        <div className="search-container">
          <div className="search-box">
            <Input
              className="search-input"
              placeholder="搜索活动名称、描述或地点"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => setSearchText(searchText)}
            />
            <Button
              className="search-button"
              onClick={() => setSearchText(searchText)}
              icon={<SearchOutlined />}
            >
              搜索
            </Button>
          </div>
        </div>

        {/* 活动列表区域 */}
        <div className="activities-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="正在加载活动列表..." />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="empty-container">
              <Empty description="暂无活动" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {paginatedActivities.map(activity => {
                  const now = new Date();
                  const isRegistrationEnded = now > new Date(activity.registrationEndTime);
                  const isEnded = now > new Date(activity.endTime);
                  const isJoined = isUserJoined(activity);
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} xl={6} key={activity._id}>
                      <Card
                        className={getActivityCardClass(activity)}
                        hoverable={!isRegistrationEnded && !isEnded}
                        cover={activity.image ? (
                          <img
                            src={activity.image.startsWith('http') ? activity.image : `http://localhost:5000${activity.image}`}
                            alt={activity.title}
                            style={{ height: 180, objectFit: 'cover' }}
                            onLoad={(e) => {
                              console.log('图片加载成功:', activity.image);
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/default-activity.jpg';
                              console.error('图片加载失败:', activity.image);
                            }}
                          />
                        ) : (
                          <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarOutlined style={{ fontSize: 40, color: '#999' }} />
                          </div>
                        )}
                        onClick={() => !isRegistrationEnded && !isEnded && showActivityDetails(activity)}
                      >
                        <Card.Meta
                          title={activity.title}
                          description={
                            <>
                              <div style={{ minHeight: 40 }}>{activity.description}</div>
                              <div style={{ marginTop: 8 }}>
                                <Tag color="blue">{activity.type.name}</Tag>
                                <Tag color="gold">积分：{activity.points}</Tag>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <span>开始：{new Date(activity.startTime).toLocaleString()}</span><br />
                                <span>结束：{new Date(activity.endTime).toLocaleString()}</span><br />
                                <span>报名截止：{new Date(activity.registrationEndTime).toLocaleString()}</span>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                {isEnded ? (
                                  <Tag color="default">已结束</Tag>
                                ) : isRegistrationEnded ? (
                                  <Tag color="orange">报名已截止</Tag>
                                ) : (
                                  <Tag color="green">可报名</Tag>
                                )}
                              </div>
                              <div style={{ marginTop: 8 }}>
                                {isJoined ? (
                                  <Button type="default" disabled className="join-btn join-btn-joined">已报名</Button>
                                ) : isEnded ? (
                                  <Button type="default" disabled className="join-btn join-btn-expired">活动已结束</Button>
                                ) : isRegistrationEnded ? (
                                  <Button type="default" disabled className="join-btn join-btn-expired">报名已截止</Button>
                                ) : (
                                  <Button type="primary" className="join-btn join-btn-available" onClick={e => { e.stopPropagation(); handleJoinActivity(activity._id); }} loading={joining === activity._id}>立即报名</Button>
                                )}
                              </div>
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
              <div className="pagination-container">
                <Pagination
                  current={currentPage}
                  total={filteredActivities.length}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {renderActivityModal()}
    </div>
  );
};

export default ActivitiesList; 