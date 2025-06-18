import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  message,
  Card,
  Space,
  Modal,
  Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface ActivityType {
  id: number;
  name: string;
  description?: string;
}

interface Activity {
  id: number;
  title: string;
  description?: string;
  type: ActivityType;
  points: number;
  startTime: string;
  endTime: string;
  location?: string;
  maxParticipants?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  creator: {
    id: number;
    username: string;
  };
}

const ActivityManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // 获取活动类型列表
  const fetchActivityTypes = async () => {
    try {
      const response = await axios.get('/api/activities/types');
      setActivityTypes(response.data);
    } catch (error) {
      message.error('获取活动类型失败');
    }
  };

  // 获取活动列表
  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/activities');
      setActivities(response.data);
    } catch (error) {
      message.error('获取活动列表失败');
    }
  };

  useEffect(() => {
    fetchActivityTypes();
    fetchActivities();
  }, []);

  // 创建新活动
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const [startTime, endTime] = values.timeRange;
      const activityData = {
        ...values,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      delete activityData.timeRange;

      await axios.post('/api/activities', activityData);
      message.success('活动创建成功');
      form.resetFields();
      fetchActivities();
    } catch (error) {
      message.error('活动创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新活动类型
  const handleCreateActivityType = async () => {
    try {
      await axios.post('/api/activities/types', { name: newTypeName });
      message.success('活动类型创建成功');
      setIsTypeModalVisible(false);
      setNewTypeName('');
      fetchActivityTypes();
    } catch (error) {
      message.error('活动类型创建失败');
    }
  };

  // 更新活动状态
  const handleStatusChange = async (id: number, status: Activity['status']) => {
    try {
      await axios.patch(`/api/activities/${id}/status`, { status });
      message.success('活动状态更新成功');
      fetchActivities();
    } catch (error) {
      message.error('活动状态更新失败');
    }
  };

  const getStatusTag = (status: Activity['status']) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      published: { color: 'success', text: '已发布' },
      cancelled: { color: 'error', text: '已取消' },
      completed: { color: 'processing', text: '已完成' },
    };
    const { color, text } = statusMap[status];
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    { title: '活动名称', dataIndex: 'title', key: 'title' },
    { title: '活动类型', dataIndex: ['type', 'name'], key: 'type' },
    { title: '积分', dataIndex: 'points', key: 'points' },
    {
      title: '时间',
      key: 'time',
      render: (record: Activity) => (
        <>
          {moment(record.startTime).format('YYYY-MM-DD HH:mm')}
          <br />
          至
          <br />
          {moment(record.endTime).format('YYYY-MM-DD HH:mm')}
        </>
      ),
    },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      key: 'status',
      render: (record: Activity) => (
        <Space>
          {getStatusTag(record.status)}
          {record.status === 'draft' && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, 'published')}
            >
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="创建新活动">
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="title"
              label="活动名称"
              rules={[{ required: true, message: '请输入活动名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="typeId"
              label="活动类型"
              rules={[{ required: true, message: '请选择活动类型' }]}
            >
              <Select
                placeholder="选择活动类型"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => setIsTypeModalVisible(true)}
                    >
                      添加新类型
                    </Button>
                  </>
                )}
              >
                {activityTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="活动时间"
              rules={[{ required: true, message: '请选择活动时间' }]}
            >
              <RangePicker showTime />
            </Form.Item>

            <Form.Item
              name="points"
              label="活动积分"
              rules={[{ required: true, message: '请输入活动积分' }]}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item name="location" label="活动地点">
              <Input />
            </Form.Item>

            <Form.Item
              name="maxParticipants"
              label="最大参与人数"
              rules={[{ required: true, message: '请输入最大参与人数' }]}
            >
              <InputNumber min={1} />
            </Form.Item>

            <Form.Item name="description" label="活动描述">
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建活动
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="活动列表">
          <Table
            columns={columns}
            dataSource={activities}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      <Modal
        title="创建新活动类型"
        open={isTypeModalVisible}
        onOk={handleCreateActivityType}
        onCancel={() => setIsTypeModalVisible(false)}
      >
        <Input
          placeholder="请输入活动类型名称"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ActivityManagement; 