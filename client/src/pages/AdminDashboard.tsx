import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal, Space, Tag, Statistic, Row, Col, Tabs, Form, Input, DatePicker, InputNumber, Upload, Select, Switch, Alert } from 'antd';
import { UserOutlined, DeleteOutlined, ExclamationCircleOutlined, CalendarOutlined, PlusOutlined, UploadOutlined, TeamOutlined, HistoryOutlined, TrophyOutlined, ShopOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import AmapPicker from '../components/AmapPicker';
import CitySelector from '../components/CitySelector';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);




// 添加 axios 拦截器，确保请求带有 token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface User {
  _id: string;
  username: string;
  email: string;
  studentId: string;
  role: string;
  points: number;
  createdAt: string;
}

interface Activity {
  _id: string;
  title: string;
  description: string;
  type: string;
  points: number;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  location?: string;
  status: string;
  image?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ActivityType {
  _id: string;
  name: string;
  description?: string;
  basePoints: number;
}

// 确保正确获取文件对象，并处理可能的null/undefined
const getBase64 = (file?: UploadFile): Promise<{ blob: string, file: File } | null> =>
  new Promise((resolve, reject) => {
    if (!file || !file.originFileObj) {
      // 如果没有文件或文件对象无效，返回null而不是reject错误
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => resolve({ blob: reader.result as string, file: file.originFileObj as File });
    reader.onerror = (error) => reject(error);
  });

const AdminDashboard: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [checkinMapVisible, setCheckinMapVisible] = useState(false);
  const [checkinLocation, setCheckinLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  useEffect(() => {
    fetchUsers();
    fetchActivityTypes();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (activeTab === '2') {
      fetchActivities();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<User[]>>('http://localhost:5000/api/admin/users');

      if (response.data.success) {
        // 过滤掉管理员用户
        const normalUsers = response.data.data.filter(user => user.role !== 'admin');
        setUsers(normalUsers);
        setTotalUsers(normalUsers.length);
        const total = normalUsers.reduce((sum, user) => sum + user.points, 0);
        setTotalPoints(total);
      } else if (response.data.message) {
        message.error(response.data.message);
      }
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else if (error.message) {
        message.error(`获取用户列表失败: ${error.message}`);
      } else {
        message.error('获取用户列表失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个用户吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await axios.delete<ApiResponse<null>>(
            `http://localhost:5000/api/admin/users/${userId}`
          );

          if (response.data.success) {
            message.success('用户删除成功');
            fetchUsers();
          } else if (response.data.message) {
            message.error(response.data.message);
          }
        } catch (error: any) {
          console.error('删除用户失败:', error);
          if (error.response && error.response.data && error.response.data.message) {
            message.error(error.response.data.message);
          } else if (error.message) {
            message.error(`删除用户失败: ${error.message}`);
          } else {
            message.error('删除用户失败，请稍后重试');
          }
        }
      }
    });
  };

  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const response = await axios.get<ApiResponse<Activity[]>>('http://localhost:5000/api/admin/activities?showAll=true');
      if (response.data.success) {
        setActivities(response.data.data);
      } else if (response.data.message) {
        message.error(response.data.message);
      }
    } catch (error: any) {
      console.error('获取活动列表失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else if (error.message) {
        message.error(`获取活动列表失败: ${error.message}`);
      } else {
        message.error('获取活动列表失败，请检查网络连接');
      }
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/activities/types');
      if (response.data) {
        setActivityTypes(response.data);
      }
    } catch (error) {
      console.error('获取活动类型失败:', error);
      message.error('获取活动类型失败');
    }
  };

  const handleCreateActivity = async (values: Record<string, any>) => {
    try {
      const formData = new FormData();
      formData.append('title', values.name);
      formData.append('description', values.description);
      formData.append('points', values.points.toString());
      formData.append('startTime', values.date.toISOString());
      formData.append('endTime', values.endDate.toISOString());
      formData.append('registrationEndTime', values.registrationEndDate.toISOString());
      formData.append('type', values.type);
      formData.append('status', values.status);

      // 修改图片上传处理逻辑
      if (values.image && values.image.length > 0) {
        const file = values.image[0].originFileObj;
        if (file) {
          formData.append('image', file);
        }
      }

      // 添加团队活动相关字段
      formData.append('isTeamActivity', values.isTeamActivity ? 'true' : 'false');
      if (values.isTeamActivity) {
        formData.append('minTeamSize', values.minTeamSize?.toString() || '1');
        formData.append('maxTeamSize', values.maxTeamSize?.toString() || '1');
      }

      // 添加签到相关字段
      if (values.checkinRequired) {
        formData.append('checkinRequired', 'true');
        if (values.checkinStartTime) formData.append('checkinStartTime', values.checkinStartTime.toISOString());
        if (values.checkinEndTime) formData.append('checkinEndTime', values.checkinEndTime.toISOString());
        if (checkinLocation) {
          formData.append('latitude', checkinLocation.latitude.toString());
          formData.append('longitude', checkinLocation.longitude.toString());
        }
        if (values.checkinRadius) formData.append('checkinRadius', values.checkinRadius.toString());
      }

      const response = await axios.post('http://localhost:5000/api/admin/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success('活动创建成功');
        setActivityModalVisible(false);
        form.resetFields();
        fetchActivities();
      } else if (response.data.message) {
        message.error(response.data.message);
      }
    } catch (error: any) {
      console.error('创建活动失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('创建活动失败，请重试');
      }
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/admin/activities/${activityId}`);
      if (response.data.success) {
        message.success('活动删除成功');
        fetchActivities();
      } else if (response.data.message) {
        message.error(response.data.message);
      }
    } catch (error: any) {
      console.error('删除活动失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else if (error.message) {
        message.error(`删除活动失败: ${error.message}`);
      } else {
        message.error('删除活动失败，请稍后重试');
      }
    }
  };

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '电子邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: User) => (
        <Space size="middle">
          <Button
            onClick={() => navigate(`/admin/users/points-history/${record._id}`)}
            icon={<HistoryOutlined />}
            type="primary"
            size="small"
          >
            积分记录
          </Button>
          <Button
            onClick={() => handleDeleteUser(record._id)}
            icon={<DeleteOutlined />}
            danger
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const activityColumns = [
    {
      title: '活动图片',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => (
        image ? <img src={`http://localhost:5000${image}`} alt="活动图片" style={{ width: 50, height: 50, objectFit: 'cover' }} /> : '无图片'
      ),
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
      ellipsis: true,
    },
    {
      title: '活动时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime: string) => new Date(startTime).toLocaleString(),
    },
    {
      title: '报名截止时间',
      dataIndex: 'registrationEndTime',
      key: 'registrationEndTime',
      render: (registrationEndTime: string) => registrationEndTime ? new Date(registrationEndTime).toLocaleString() : '无',
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: Activity) => {
        const now = new Date();
        if (now > new Date(record.endTime)) {
          return <Tag color="default">已结束</Tag>;
        } else if (now > new Date(record.registrationEndTime)) {
          return <Tag color="orange">报名已截止</Tag>;
        } else {
          return <Tag color="green">报名中</Tag>;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Activity) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => navigate(`/admin/activities/${record._id}/participants`)}
          >
            参与者
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteActivity(record._id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>管理员面板</h1>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={8} xl={8}>
          <Card>
            <Statistic
              title="用户总数"
              value={totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={8}>
          <Card>
            <Statistic
              title="总积分"
              value={totalPoints}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={8}>
          <Card>
            <Statistic
              title="活动数量"
              value={activities.length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" className="quick-actions-card" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              block
              onClick={() => navigate('/admin/activities')}
            >
              活动管理
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<HistoryOutlined />}
              block
              onClick={() => navigate('/admin/points-records')}
            >
              积分记录
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<ShopOutlined />}
              block
              onClick={() => navigate('/admin/products')}
            >
              商品管理
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<ShoppingOutlined />}
              block
              onClick={() => navigate('/admin/exchanges')}
            >
              兑换管理
            </Button>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="用户管理" key="1">
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="活动管理" key="2">
          <div className="tab-content">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setActivityModalVisible(true)}
              style={{ marginBottom: 16 }}
            >
              添加活动
            </Button>
            <Table
              columns={activityColumns}
              dataSource={activities}
              loading={activityLoading}
              rowKey="_id"
              pagination={{
                pageSize: 5,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </div>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="创建新活动"
        visible={activityModalVisible}
        onCancel={() => {
          setActivityModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateActivity}
        >
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="image"
                label="活动图片"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('只能上传图片文件!');
                      return false;
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error('图片必须小于 5MB!');
                      return false;
                    }
                    console.log('准备上传图片:', file.name);
                    return false;
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传图片</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="name"
                label="活动名称"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input placeholder="请输入活动名称" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="type"
                label="活动类型"
                rules={[{ required: true, message: '请选择活动类型' }]}
              >
                <Select placeholder="请选择活动类型">
                  {activityTypes.map((type: ActivityType) => (
                    <Select.Option key={type._id} value={type._id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="活动描述"
                rules={[{ required: true, message: '请输入活动描述' }]}
              >
                <Input.TextArea rows={3} placeholder="请输入活动描述" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="date"
                label="活动开始时间"
                rules={[
                  { required: true, message: '请选择活动开始时间' },
                  {
                    validator: async (_, value) => {
                      if (value && value.isBefore(dayjs())) {
                        throw new Error('活动开始时间必须晚于当前时间');
                      }
                    }
                  }
                ]}
                tooltip="活动开始时间必须晚于当前时间"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="endDate"
                label="活动结束时间"
                rules={[
                  { required: true, message: '请选择活动结束时间' },
                  {
                    validator: async (_, value) => {
                      const startTime = form.getFieldValue('date');
                      if (value && startTime && value.isSameOrBefore(startTime)) {
                        throw new Error('活动结束时间必须晚于开始时间');
                      }
                    }
                  }
                ]}
                tooltip="活动结束时间必须晚于开始时间"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="registrationEndDate"
                label="报名截止时间"
                rules={[
                  { required: true, message: '请选择报名截止时间' },
                  {
                    validator: async (_, value) => {
                      const startTime = form.getFieldValue('date');
                      if (value && startTime && value.isSameOrAfter(startTime)) {
                        throw new Error('报名截止时间必须早于活动开始时间');
                      }
                    }
                  }
                ]}
                tooltip="报名截止时间必须早于活动开始时间"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="points"
                label="活动积分"
                rules={[{ required: true, message: '请输入活动积分' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="isTeamActivity"
                label="是否为团队活动"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="status"
                label="活动状态"
                rules={[{ required: true, message: '请选择活动状态' }]}
              >
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">发布</Select.Option>
                  <Select.Option value="cancelled">取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="checkinRequired"
                label="需要签到"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.checkinRequired !== currentValues.checkinRequired
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('checkinRequired') && (
                  <Form.Item
                    name="checkinEndTime"
                    label="签到截止时间"
                    rules={[
                      { required: true, message: '请选择签到截止时间' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value) {
                            return Promise.resolve();
                          }
                          const startTime = getFieldValue('date');
                          const endTime = dayjs(startTime).add(15, 'minute');
                          if (value.isAfter(endTime)) {
                            return Promise.reject('签到截止时间必须在活动开始后15分钟内');
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                    tooltip="签到截止时间必须在活动开始后15分钟内"
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="选择签到截止时间"
                    />
                  </Form.Item>
                )
              }

            </Form.Item>
            <Col span={24}>
              <Form.Item label="签到位置">
                <Button type="primary" onClick={() => setCheckinMapVisible(true)}>
                  选择签到位置
                </Button>
                {checkinLocation && (
                  <div style={{ marginTop: 8, color: '#555' }}>
                    已选经度：{checkinLocation.longitude}，纬度：{checkinLocation.latitude}
                  </div>
                )}
                <Modal
                  open={checkinMapVisible}
                  title="选择签到位置"
                  onCancel={() => setCheckinMapVisible(false)}
                  onOk={() => {
                    form.setFieldsValue({ checkinLocation });
                    setCheckinMapVisible(false);
                  }}
                  width={1000}
                  okText="确定"
                  cancelText="取消"
                  destroyOnClose
                >
                  <AmapPicker
                    value={checkinLocation}
                    onChange={setCheckinLocation}
                    mapHeight={1000} // 这里加上
                  />
                </Modal>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isTeamActivity !== currentValues.isTeamActivity}
          >
            {({ getFieldValue }) =>
              getFieldValue('isTeamActivity') ? (
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="minTeamSize"
                      label="最小团队人数"
                      rules={[{ required: true, message: '请输入最小团队人数' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="maxTeamSize"
                      label="最大团队人数"
                      rules={[{ required: true, message: '请输入最大团队人数' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                setActivityModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;