import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Descriptions,
  Button
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import './ActivityParticipants.css';

const { Title } = Typography;

interface Participant {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    studentId: string;
    points: number;
  };
  joinTime: string;
  checkinTime?: string;
}

interface Activity {
  _id: string;
  title: string;
  description: string;
  points: number;
  startTime: string;
  endTime: string;
  status: string;
  type: {
    _id: string;
    name: string;
  };
  checkinRequired: boolean;
  checkinStartTime: string;
  checkinEndTime: string;
  checkinRadius: number;
  checkinLocation?: {
    type: string;
    coordinates: number[];
  };
}

const ActivityParticipants: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetchParticipants();
    fetchActivityDetail();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/activities/${activityId}/participants`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        setParticipants(response.data.data);
      }
    } catch (error) {
      // 错误处理
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityDetail = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        setActivity(response.data.data);
      }
    } catch (error) {
      // 错误处理
    }
  };

  const columns = [
    { title: '用户名', dataIndex: ['user', 'username'], key: 'username' },
    { title: '学号', dataIndex: ['user', 'studentId'], key: 'studentId' },
    { title: '邮箱', dataIndex: ['user', 'email'], key: 'email' },
    { title: '当前积分', dataIndex: ['user', 'points'], key: 'points' },
    { title: '报名时间', dataIndex: 'joinTime', key: 'joinTime', render: (joinTime: string) => new Date(joinTime).toLocaleString() },
    { title: '报名状态', key: 'status', render: () => <Tag color="success">已报名</Tag> },
    { title: '签到状态', key: 'checkin', render: (participant: Participant) => participant.checkinTime ? <Tag color="success">已签到</Tag> : <Tag>未签到</Tag> },
    { title: '操作', key: 'action', render: () => null },
  ];

  return (
    <div className="activity-participants-container">
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin-dashboard')}>
          返回
        </Button>
        <Title level={3}>活动参与者管理</Title>
      </div>

      {activity && (
        <Card className="activity-info-card">
          <Descriptions title="活动信息" bordered>
            <Descriptions.Item label="活动名称" span={3}>{activity.title}</Descriptions.Item>
            <Descriptions.Item label="活动类型">{activity.type.name}</Descriptions.Item>
            <Descriptions.Item label="积分">{activity.points}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={activity.status === 'published' ? 'green' : 'default'}>
                {activity.status === 'published' ? '已发布' : activity.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间" span={1}>
              {new Date(activity.startTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间" span={2}>
              {new Date(activity.endTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="签到要求" span={3}>
              {activity.checkinRequired ? '需要签到' : '无需签到'}
            </Descriptions.Item>
            <Descriptions.Item label="签到时间" span={3}>
              {activity.checkinRequired
                ? `${new Date(activity.checkinStartTime).toLocaleString()} - ${new Date(activity.checkinEndTime).toLocaleString()}`
                : '无'}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={3}>{activity.description}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="参与者列表" className="participants-card">
        <Table
          columns={columns}
          dataSource={participants}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          summary={pageData => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}>
                  <Space size="large">
                    <span>总参与者: {participants.length}</span>
                  </Space>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default ActivityParticipants;