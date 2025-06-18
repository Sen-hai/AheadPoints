import React, { useEffect, useRef } from 'react';

interface AmapPickerProps {
  value?: { latitude: number; longitude: number };
  onChange?: (val: { latitude: number; longitude: number }) => void;
  mapHeight?: number;
}

const AmapPicker: React.FC<AmapPickerProps> = ({ value, onChange, mapHeight = 400 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // 动态加载高德地图JS API
    if (!(window as any).AMap) {
      const script = document.createElement('script');
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=';
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
    // eslint-disable-next-line
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;
    const center = value
      ? [value.longitude, value.latitude]
      : [116.397428, 39.90923]; // 默认北京天安门
    mapInstance.current = new AMap.Map(mapRef.current, {
      zoom: 13,
      center,
    });
    markerRef.current = new AMap.Marker({
      position: center,
      draggable: true,
      cursor: 'move',
    });
    mapInstance.current.add(markerRef.current);
    markerRef.current.on('dragend', (e: any) => {
      const lnglat = e.lnglat;
      if (onChange) {
        onChange({ latitude: lnglat.lat, longitude: lnglat.lng });
      }
    });
    // 点击地图也可选点
    mapInstance.current.on('click', (e: any) => {
      markerRef.current.setPosition(e.lnglat);
      if (onChange) {
        onChange({ latitude: e.lnglat.lat, longitude: e.lnglat.lng });
      }
    });
  };

  // 外部value变化时同步marker
  useEffect(() => {
    if (markerRef.current && value) {
      markerRef.current.setPosition([value.longitude, value.latitude]);
      mapInstance.current.setCenter([value.longitude, value.latitude]);
    }
  }, [value]);

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: mapHeight, borderRadius: 8 }} />
      {value && (
        <div style={{ marginTop: 8, color: '#555' }}>
          当前经度：{value.longitude}，纬度：{value.latitude}
        </div>
      )}
    </div>
  );
};

export default AmapPicker;