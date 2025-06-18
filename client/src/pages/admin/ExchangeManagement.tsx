import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Image,
  message,
  Spin,
  Empty,
  Input,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  TrophyOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { Exchange, ApiResponse, Pagination } from '../../types';
import './ExchangeManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ExchangeManagement: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    fetchExchanges();
  }, [pagination.page, searchText, statusFilter]);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse<{
        exchanges: Exchange[];
        pagination: Pagination;
      }>>('http://localhost:5000/api/admin/products/exchanges', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      if (response.data.success && response.data.data) {
        setExchanges(response.data.data.exchanges);
        setPagination(response.data.data.pagination);
      } else {
        message.error(response.data.message || '获取兑换记录失败');
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error);
      message.error('获取兑换记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTableChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: ['product', 'image'],
      key: 'productImage',
      width: 80,
      render: (image: string, record: Exchange) => (
        image ? (
          <Image
            src={`http://localhost:5000${image}`}
            alt={record.product.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: '6px' }}
          />
        ) : (
          <div className="no-image-small">无图片</div>
        )
      ),
    },
    {
      title: '商品名称',
      dataIndex: ['product', 'name'],
      key: 'productName',
      render: (name: string) => (
        <Text strong>{name}</Text>
      ),
    },
    {
      title: '用户信息',
      key: 'userInfo',
      render: (record: Exchange) => (
        <div>
          <div>
            <UserOutlined style={{ marginRight: 4 }} />
            <Text strong>{record.user.username}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.user.studentId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: ['product', 'price'],
      key: 'productPrice',
      render: (price: number) => (
        <span className="price-text">
          <TrophyOutlined style={{ color: '#faad14' }} />
          {price} 积分
        </span>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <Text strong>×{quantity}</Text>
      ),
    },
    {
      title: '消耗积分',
      dataIndex: 'pointsUsed',
      key: 'pointsUsed',
      render: (points: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          -{points}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'green', text: '已完成' },
          pending: { color: 'orange', text: '处理中' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '兑换时间',
      dataIndex: 'exchangeTime',
      key: 'exchangeTime',
      render: (time: string) => (
        <div className="time-info">
          <CalendarOutlined style={{ marginRight: 4 }} />
          {new Date(time).toLocaleString()}
        </div>
      ),
    },
  ];

  // 计算统计信息
  const totalExchanges = exchanges.length;
  const totalPointsUsed = exchanges.reduce((sum, exchange) => sum + exchange.pointsUsed, 0);
  const completedExchanges = exchanges.filter(exchange => exchange.status === 'completed').length;
  const uniqueUsers = new Set(exchanges.map(exchange => exchange.user._id)).size;

  return (
    <div className="exchange-management-container">
      <div className="page-header">
        <Title level={2}>
          <ShoppingOutlined style={{ marginRight: 8 }} />
          兑换记录管理
        </Title>
        <Text type="secondary">管理所有用户的积分兑换记录</Text>
      </div>

      {/* 统计卡片 */}
      <div className="stats-cards">
        <Card className="stat-card">
          <Statistic
            title="总兑换次数"
            value={totalExchanges}
            prefix={<ShoppingOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="累计消耗积分"
            value={totalPointsUsed}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="成功兑换"
            value={completedExchanges}
            prefix={<ShoppingOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title="参与用户"
            value={uniqueUsers}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </div>

      {/* 筛选区域 */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="搜索用户名或商品名称"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ maxWidth: 300 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              onChange={handleStatusFilter}
            >
              <Option value="completed">已完成</Option>
              <Option value="pending">处理中</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 兑换记录表格 */}
      <Card className="table-card">
        <Spin spinning={loading}>
          {exchanges.length === 0 ? (
            <Empty 
              description="暂无兑换记录" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={exchanges}
              rowKey="_id"
              pagination={{
                current: pagination.page,
                total: pagination.total,
                pageSize: pagination.limit,
                onChange: handleTableChange,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ExchangeManagement; 