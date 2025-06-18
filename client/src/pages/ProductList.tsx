import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  message,
  Modal,
  InputNumber,
  Typography,
  Tag,
  Spin,
  Empty,
  Pagination,
  Image,
} from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { Product, ApiResponse, Pagination as PaginationType } from '../types';
import { useAuth } from '../hooks/useAuth';
import './ProductList.css';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState<PaginationType>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [exchangeQuantity, setExchangeQuantity] = useState(1);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const { user, refreshUser, updateUser } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, searchText]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<{
        products: Product[];
        pagination: PaginationType;
      }>>('http://localhost:5000/api/products', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchText,
        },
      });

      if (response.data.success && response.data.data) {
        setProducts(response.data.data.products);
        setPagination(response.data.data.pagination);
      } else {
        message.error(response.data.message || '获取商品列表失败');
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const showExchangeModal = (product: Product) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setSelectedProduct(product);
    setExchangeQuantity(1);
    setExchangeModalVisible(true);
  };

  const handleExchange = async () => {
    if (!selectedProduct || !user) return;

    const totalPoints = selectedProduct.price * exchangeQuantity;
    
    confirm({
      title: '确认兑换',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>商品：{selectedProduct.name}</p>
          <p>数量：{exchangeQuantity}</p>
          <p>需要积分：{totalPoints}</p>
          <p>当前积分：{user.points || 0}</p>
          <p>兑换后剩余：{(user.points || 0) - totalPoints}</p>
        </div>
      ),
      onOk: async () => {
        setExchangeLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            'http://localhost:5000/api/products/exchange',
            {
              productId: selectedProduct._id,
              quantity: exchangeQuantity,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            message.success('兑换成功！');
            setExchangeModalVisible(false);
            fetchProducts(); // 刷新商品列表
            refreshUser(); // 刷新用户信息
            // 更新本地用户信息
            const updatedUser = {
              ...user,
              points: response.data.data.remainingPoints
            };
            updateUser(updatedUser);
          } else {
            message.error(response.data.message || '兑换失败');
          }
        } catch (error: unknown) {
          console.error('兑换失败:', error);
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            if (axiosError.response?.data?.message) {
              message.error(axiosError.response.data.message);
            } else {
              message.error('兑换失败');
            }
          } else {
            message.error('兑换失败');
          }
        } finally {
          setExchangeLoading(false);
        }
      },
    });
  };

  const canExchange = (product: Product | null) => {
    if (!user || !product) return false;
    const totalPoints = product.price * exchangeQuantity;
    return (user.points || 0) >= totalPoints && product.stock >= exchangeQuantity;
  };

  return (
    <div className="product-list-container">
      <div className="page-header">
        <Title level={2}>积分商城</Title>
        <Text type="secondary">使用积分兑换心仪的商品</Text>
      </div>

      {user && (
        <Card className="user-points-card">
          <div className="points-info">
            <TrophyOutlined style={{ fontSize: '24px', color: '#faad14' }} />
            <span className="points-text">
              我的积分：<strong>{user.points || 0}</strong>
            </span>
          </div>
        </Card>
      )}

      <div className="search-section">
        <Input.Search
          placeholder="搜索商品名称"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 400 }}
        />
      </div>

      <Spin spinning={loading}>
        {products.length === 0 ? (
          <Empty description="暂无商品" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {products.map((product) => (
                <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                  <Card
                    hoverable
                    className="product-card"
                    cover={
                      product.image ? (
                        <Image
                          alt={product.name}
                          src={`http://localhost:5000${product.image}`}
                          height={200}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="no-image">暂无图片</div>
                      )
                    }
                    actions={[
                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => showExchangeModal(product)}
                        disabled={!user || product.stock === 0}
                      >
                        兑换
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={product.name}
                      description={
                        <div>
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ marginBottom: 8 }}
                          >
                            {product.description || '暂无描述'}
                          </Paragraph>
                          <div className="product-info">
                            <div className="price-info">
                              <TrophyOutlined style={{ color: '#faad14' }} />
                              <span className="price">{product.price} 积分</span>
                            </div>
                            <div className="stock-info">
                              <Tag color={product.stock > 0 ? 'green' : 'red'}>
                                库存: {product.stock}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="pagination-container">
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
              />
            </div>
          </>
        )}
      </Spin>

      <Modal
        title="兑换商品"
        open={exchangeModalVisible}
        onCancel={() => setExchangeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExchangeModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="exchange"
            type="primary"
            loading={exchangeLoading}
            disabled={!canExchange(selectedProduct)}
            onClick={handleExchange}
          >
            确认兑换
          </Button>,
        ]}
      >
        {selectedProduct && (
          <div className="exchange-modal-content">
            <div className="product-info-section">
              <Title level={4}>{selectedProduct.name}</Title>
              <Text type="secondary">{selectedProduct.description}</Text>
            </div>

            <div className="exchange-form">
              <div className="form-item">
                <Text strong>兑换数量：</Text>
                <InputNumber
                  min={1}
                  max={Math.min(selectedProduct.stock, Math.floor((user?.points || 0) / selectedProduct.price))}
                  value={exchangeQuantity}
                  onChange={(value) => setExchangeQuantity(value || 1)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="exchange-summary">
                <div className="summary-item">
                  <Text>单价：</Text>
                  <Text strong>{selectedProduct.price} 积分</Text>
                </div>
                <div className="summary-item">
                  <Text>总计：</Text>
                  <Text strong style={{ color: '#faad14' }}>
                    {selectedProduct.price * exchangeQuantity} 积分
                  </Text>
                </div>
                <div className="summary-item">
                  <Text>当前积分：</Text>
                  <Text>{user?.points || 0}</Text>
                </div>
                <div className="summary-item">
                  <Text>兑换后剩余：</Text>
                  <Text
                    style={{
                      color: canExchange(selectedProduct) ? '#52c41a' : '#f5222d',
                    }}
                  >
                    {(user?.points || 0) - selectedProduct.price * exchangeQuantity}
                  </Text>
                </div>
              </div>

              {!canExchange(selectedProduct) && (
                <div className="warning-message">
                  {(user?.points || 0) < selectedProduct.price * exchangeQuantity
                    ? '积分不足'
                    : '库存不足'}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList; 