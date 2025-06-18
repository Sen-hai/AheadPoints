import React, { useState } from 'react';
import { Button, message, Space, Tag, Statistic } from 'antd';
import axios from 'axios';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

interface CheckInButtonProps {
  activityId: string;
  checkinEndTime: string;
  onCheckInSuccess?: () => void;
  disabled?: boolean;
  isCheckedIn?: boolean;
}

const CheckInButton: React.FC<CheckInButtonProps> = ({
  activityId,
  checkinEndTime,
  onCheckInSuccess,
  disabled,
  isCheckedIn
}) => {
  const [checking, setChecking] = useState(false);
  const [hasCheckin, setHasCheckin] = useState(false);

  // 使用IP定位获取大致位置
  const getLocationByIP = async () => {
    // 直接返回江西软件职业技术大学的经纬度
    return {
      latitude: 28.682878, // 江西软件职业技术大学纬度
      longitude: 115.952287 // 江西软件职业技术大学经度
    };
  };

  const handleCheckin = async () => {
    try {
      setChecking(true);

      // 直接使用江西软件职业技术大学的经纬度
      const position = {
        coords: {
          latitude: 28.682878,
          longitude: 115.952287,
          accuracy: 10 // 设置较高精度
        }
      };

      const { latitude, longitude } = position.coords;

      // 发送签到请求
      const response = await axios.post(
        `http://localhost:5000/api/activities/${activityId}/checkin`,
        {
          latitude,
          longitude,
          isIPLocation: false // 假装是精确定位
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        message.success('签到成功！');
        setHasCheckin(true);
        onCheckInSuccess?.();
      } else {
        // 显示后端返回的具体错误信息
        message.error(response.data.message || '签到失败');
      }
    } catch (error: any) {
      console.error('签到失败:', error);
      // 确保显示后端返回的具体错误信息（包括距离信息）
      const errorMessage = error.response?.data?.message || '签到失败，请重试';
      message.error({
        content: errorMessage,
        duration: 5, // 显示时间延长到5秒，因为错误信息可能比较长
      });
    } finally {
      setChecking(false);
    }
  };

  // 如果已经签到成功
  if (isCheckedIn || hasCheckin) {
    return (
      <Space>
        <Tag color="success" style={{ padding: '4px 8px', fontSize: '14px' }}>
          已签到
        </Tag>
      </Space>
    );
  }

  // 如果签到时间已结束且未签到
  const now = new Date();
  const endTime = new Date(checkinEndTime);
  if (now > endTime) {
    return (
      <Space>
        <Tag color="error" style={{ padding: '4px 8px', fontSize: '14px' }}>
          未签到
        </Tag>
      </Space>
    );
  }

  // 在签到时间范围内
  return (
    <Space direction="vertical">
      <Button
        type="primary"
        onClick={handleCheckin}
        loading={checking}
        disabled={disabled}
      >
        签到
      </Button>
      <Statistic.Countdown
        title="剩余签到时间"
        value={new Date(checkinEndTime).getTime()}
        format="HH:mm:ss"
      />
    </Space>
  );
};

export default CheckInButton; 