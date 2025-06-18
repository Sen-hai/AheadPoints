import React from 'react';
import { Select } from 'antd';

const cityList = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安',
  '天津', '苏州', '长沙', '郑州', '青岛', '合肥', '福州', '厦门', '宁波', '无锡',
];

interface CitySelectorProps {
  value?: string;
  onChange?: (city: string) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ value, onChange }) => {
  return (
    <Select
      showSearch
      placeholder="请选择城市"
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      filterOption={(input, option) =>
        (option?.children as string).toLowerCase().includes(input.toLowerCase())
      }
    >
      {cityList.map(city => (
        <Select.Option key={city} value={city}>
          {city}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CitySelector;