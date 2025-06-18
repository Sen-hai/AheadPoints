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
} from 'antd';
import {
  TrophyOutlined,
  ShoppingOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { Exchange, ApiResponse, Pagination } from '../types';
import { useAuth } from '../hooks/useAuth';
import './ExchangeHistory.css';

const { Title, Text } = Typography;

const ExchangeHistory: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchExchanges();
    }
  }, [user, pagination.page]);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse<{
        exchanges: Exchange[];
        pagination: Pagination;
      }>>('http://localhost:5000/api/products/exchanges/my', {
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

  return (
    <div className="exchange-history-container">
      <div className="page-header">
        <Title level={2}>
          <ShoppingOutlined style={{ marginRight: 8 }} />
          我的兑换记录
        </Title>
        <Text type="secondary">查看您的积分兑换历史</Text>
      </div>

      {/* 统计卡片 */}
      <div className="stats-cards">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{totalExchanges}</div>
            <div className="stat-label">总兑换次数</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{totalPointsUsed}</div>
            <div className="stat-label">累计消耗积分</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{completedExchanges}</div>
            <div className="stat-label">成功兑换</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{user?.points || 0}</div>
            <div className="stat-label">当前积分</div>
          </div>
        </Card>
      </div>

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
              scroll={{ x: 800 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ExchangeHistory; 