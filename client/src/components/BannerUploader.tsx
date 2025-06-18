import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Card, Modal, List, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import '../pages/Admin.css';

interface BannerImage {
  _id: string;
  url: string;
  title?: string;
  createdAt: string;
}

const BannerUploader: React.FC = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchBannerImages();
  }, []);

  const fetchBannerImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/banners', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setBannerImages(response.data.data);
      } else {
        message.error(response.data.message || '获取轮播图列表失败');
      }
    } catch (error: any) {
      console.error('获取轮播图列表失败:', error);
      message.error('获取轮播图列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('banner', file);

    try {
      setUploading(true);
      const response = await axios.post('http://localhost:5000/api/banners/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success('轮播图上传成功');
        onSuccess(response.data, file);
        fetchBannerImages(); // 重新获取轮播图列表
      } else {
        message.error(response.data.message || '轮播图上传失败');
        onError(new Error('轮播图上传失败'));
      }
    } catch (error: any) {
      console.error('轮播图上传失败:', error);
      message.error('轮播图上传失败，请稍后重试');
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/banners/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success('轮播图删除成功');
        fetchBannerImages(); // 重新获取轮播图列表
      } else {
        message.error(response.data.message || '轮播图删除失败');
      }
    } catch (error: any) {
      console.error('轮播图删除失败:', error);
      message.error('轮播图删除失败，请稍后重试');
    }
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  return (
    <Card title="轮播图管理" className="admin-card">
      <div className="upload-container">
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          accept="image/*"
          multiple={false}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            type="primary"
          >
            上传轮播图
          </Button>
        </Upload>
        <p className="upload-tip">
          推荐尺寸: 1920×500px，文件大小不超过2MB
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin tip="加载中..." />
        </div>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={bannerImages}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                cover={<img alt="轮播图" src={`http://localhost:5000${item.url}`} />}
                actions={[
                  <EyeOutlined key="preview" onClick={() => handlePreview(item.url)} />,
                  <DeleteOutlined key="delete" onClick={() => handleDelete(item._id)} />
                ]}
              >
                <Card.Meta
                  title={item.title || '轮播图'}
                  description={`上传时间: ${new Date(item.createdAt).toLocaleString()}`}
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        open={previewVisible}
        title="轮播图预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="轮播图预览" style={{ width: '100%' }} src={`http://localhost:5000${previewImage}`} />
      </Modal>
    </Card>
  );
};

export default BannerUploader; 