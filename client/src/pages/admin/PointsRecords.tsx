import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Tabs,
  message,
  Space,
  Tag,
  Typography,
  Statistic,
  Row,
  Col
} from 'antd';
import { SearchOutlined, TrophyOutlined, HistoryOutlined, ShoppingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import './PointsRecords.css';
import { useLocation, useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;
const { Title } = Typography;

interface User {
  _id: string;
  username: string;
  email: string;
  studentId: string;
  points: number;
  role?: string;
  createdAt: string;
}

interface PointsHistory {
  _id: string;
  user: string | {
    _id: string;
    username: string;
    studentId: string;
  };
  points: number;
  type: 'earned' | 'spent';
  description: string;
  relatedActivity?: string;
  createdAt: string;
}

const PointsRecords: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const userIdFromUrl = queryParams.get('userId');
  const usernameFromUrl = queryParams.get('username');

  const [users, setUsers] = useState<User[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState(userIdFromUrl ? '2' : '1');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 判断是否直接来自用户管理页面
  const isDirectFromUserManagement = !!userIdFromUrl;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userIdFromUrl && users.length > 0) {
      const user = users.find(u => u._id === userIdFromUrl);
      if (user) {
        setSelectedUser(user);
        fetchUserPointsHistory(userIdFromUrl);
        setActiveTab('2');
      }
    }
  }, [users, userIdFromUrl]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const normalUsers = response.data.data.filter((user: User) => user.role !== 'admin');
        setUsers(normalUsers);

        // 如果URL中有用户ID但还没找到用户（因为用户列表还没加载完）
        if (userIdFromUrl && !selectedUser) {
          const user = normalUsers.find((u: User) => u._id === userIdFromUrl);
          if (user) {
            setSelectedUser(user);
            fetchUserPointsHistory(userIdFromUrl);
          }
        }
      } else {
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPointsHistory = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}/points-history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setPointsHistory(response.data.data);
      } else {
        message.error(response.data.message || '获取积分记录失败');
      }
    } catch (error) {
      console.error('获取积分记录失败:', error);
      message.error('获取积分记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    fetchUserPointsHistory(user._id);
    setActiveTab('2');
  };

  const filteredUsers = users.filter(
    user =>
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '积分余额',
      dataIndex: 'points',
      key: 'points',
      sorter: (a: User, b: User) => a.points - b.points,
      render: (points: number) => (
        <span style={{ color: points > 0 ? '#52c41a' : '' }}>
          {points}
        </span>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleUserSelect(record)}
        >
          查看积分记录
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'earned' ? 'green' : 'red'}>
          {type === 'earned' ? '获取' : '消费'}
        </Tag>
      ),
    },
    {
      title: '积分数量',
      dataIndex: 'points',
      key: 'points',
      render: (points: number, record: PointsHistory) => (
        <span style={{ color: record.type === 'earned' ? '#52c41a' : '#f5222d' }}>
          {record.type === 'earned' ? '+' : '-'}{points}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const earnedRecords = pointsHistory.filter(record => record.type === 'earned');
  const spentRecords = pointsHistory.filter(record => record.type === 'spent');

  // 返回用户管理页面
  const handleBackToUserManagement = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="points-records-container">
      {isDirectFromUserManagement ? (
        <>
          <div className="page-header">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToUserManagement}
            >
              返回
            </Button>
            <Title level={3}>{selectedUser?.username || usernameFromUrl} 的积分记录</Title>
          </div>

          {selectedUser && (
            <>
              <Card className="user-info-card">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="用户"
                      value={selectedUser.username}
                      prefix={<span style={{ fontSize: '14px' }}>{selectedUser.studentId}</span>}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="当前积分"
                      value={selectedUser.points}
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="积分记录总数"
                      value={pointsHistory.length}
                      prefix={<HistoryOutlined />}
                    />
                  </Col>
                </Row>
              </Card>

              <Tabs defaultActiveKey="all">
                <TabPane tab="所有记录" key="all">
                  <Table
                    columns={historyColumns}
                    dataSource={pointsHistory}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </TabPane>
                <TabPane tab={`获取记录 (${earnedRecords.length})`} key="earned">
                  <Table
                    columns={historyColumns}
                    dataSource={earnedRecords}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </TabPane>
                <TabPane tab={`消费记录 (${spentRecords.length})`} key="spent">
                  <Table
                    columns={historyColumns}
                    dataSource={spentRecords}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </TabPane>
              </Tabs>
            </>
          )}
        </>
      ) : (
        <>
          <Title level={2}>学生积分管理</Title>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <TrophyOutlined />
                  学生列表
                </span>
              }
              key="1"
            >
              <Card>
                <div className="search-container">
                  <Input
                    placeholder="搜索用户名/学号/邮箱"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300, marginBottom: 16 }}
                  />
                </div>

                <Table
                  columns={userColumns}
                  dataSource={filteredUsers}
                  rowKey="_id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <HistoryOutlined />
                  积分记录
                </span>
              }
              key="2"
              disabled={!selectedUser}
            >
              {selectedUser && (
                <>
                  <Card className="user-info-card">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="用户"
                          value={selectedUser.username}
                          prefix={<span style={{ fontSize: '14px' }}>{selectedUser.studentId}</span>}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="当前积分"
                          value={selectedUser.points}
                          prefix={<TrophyOutlined />}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="积分记录总数"
                          value={pointsHistory.length}
                          prefix={<HistoryOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Tabs defaultActiveKey="all">
                    <TabPane tab="所有记录" key="all">
                      <Table
                        columns={historyColumns}
                        dataSource={pointsHistory}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                      />
                    </TabPane>
                    <TabPane tab={`获取记录 (${earnedRecords.length})`} key="earned">
                      <Table
                        columns={historyColumns}
                        dataSource={earnedRecords}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                      />
                    </TabPane>
                    <TabPane tab={`消费记录 (${spentRecords.length})`} key="spent">
                      <Table
                        columns={historyColumns}
                        dataSource={spentRecords}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                      />
                    </TabPane>
                  </Tabs>
                </>
              )}
            </TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PointsRecords; 