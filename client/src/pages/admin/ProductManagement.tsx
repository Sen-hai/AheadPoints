import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Popconfirm,
  Typography,
  Tag,
  Image,
  Space,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ShopOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { Product, ProductForm, ApiResponse, Pagination } from '../../types';
import './ProductManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, searchText, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse<{
        products: Product[];
        pagination: Pagination;
      }>>('http://localhost:5000/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchText,
          status: statusFilter,
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

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTableChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const showModal = (product?: Product) => {
    setEditingProduct(product || null);
    setModalVisible(true);
    if (product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        status: product.status,
      });
    } else {
      form.resetFields();
    }
  };

  const handleSubmit = async (values: ProductForm) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('name', values.name);
      formData.append('price', values.price.toString());
      formData.append('stock', values.stock.toString());
      formData.append('status', values.status);
      
      if (values.description) {
        formData.append('description', values.description);
      }
      
      if (values.image) {
        formData.append('image', values.image);
      }

      let response;
      if (editingProduct) {
        response = await axios.put(
          `http://localhost:5000/api/admin/products/${editingProduct._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/admin/products',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      if (response.data.success) {
        message.success(editingProduct ? '商品更新成功' : '商品创建成功');
        setModalVisible(false);
        fetchProducts();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error: unknown) {
      console.error('操作失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message.error(axiosError.response.data.message);
        } else {
          message.error('操作失败');
        }
      } else {
        message.error('操作失败');
      }
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/admin/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('商品删除成功');
        fetchProducts();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: unknown) {
      console.error('删除失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message.error(axiosError.response.data.message);
        } else {
          message.error('删除失败');
        }
      } else {
        message.error('删除失败');
      }
    }
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image: string, record: Product) => (
        image ? (
          <Image
            src={`http://localhost:5000${image}`}
            alt={record.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: '6px' }}
          />
        ) : (
          <div className="no-image-admin">无图片</div>
        )
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-',
    },
    {
      title: '价格(积分)',
      dataIndex: 'price',
      key: 'price',
      sorter: (a: Product, b: Product) => a.price - b.price,
      render: (price: number) => (
        <Text strong style={{ color: '#faad14' }}>{price}</Text>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      render: (stock: number) => (
        <Tag color={stock > 0 ? 'green' : 'red'}>{stock}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '创建者',
      dataIndex: ['createdBy', 'username'],
      key: 'createdBy',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            description="删除后无法恢复，且该商品不能有兑换记录"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB!');
        return false;
      }
      return false;
    },
    onChange: (info: any) => {
      if (info.file) {
        form.setFieldsValue({ image: info.file });
      }
    },
  };

  return (
    <div className="product-management-container">
      <div className="page-header">
        <Title level={2}>
          <ShopOutlined style={{ marginRight: 8 }} />
          商品管理
        </Title>
        <Text type="secondary">管理积分商城的商品</Text>
      </div>

      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="搜索商品名称"
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
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              添加商品
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="_id"
          loading={loading}
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
      </Card>

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'active' }}
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <Input.TextArea
              placeholder="请输入商品描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="价格(积分)"
                rules={[
                  { required: true, message: '请输入价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' },
                ]}
              >
                <InputNumber
                  placeholder="请输入价格"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="库存数量"
                rules={[
                  { required: true, message: '请输入库存数量' },
                  { type: 'number', min: 0, message: '库存不能为负数' },
                ]}
              >
                <InputNumber
                  placeholder="请输入库存数量"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="商品状态"
            rules={[{ required: true, message: '请选择商品状态' }]}
          >
            <Select placeholder="请选择商品状态">
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="商品图片"
          >
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              支持 JPG、PNG 格式，文件大小不超过 5MB
            </Text>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement; 