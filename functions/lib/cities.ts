export interface City {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

const CITIES: City[] = [
  { label: '北京', value: 'beijing', lat: 39.9042, lon: 116.4074 },
  { label: '上海', value: 'shanghai', lat: 31.2304, lon: 121.4737 },
  { label: '广州', value: 'guangzhou', lat: 23.1291, lon: 113.2644 },
  { label: '深圳', value: 'shenzhen', lat: 22.5431, lon: 114.0579 },
  { label: '杭州', value: 'hangzhou', lat: 30.2741, lon: 120.1551 },
  { label: '成都', value: 'chengdu', lat: 30.5728, lon: 104.0668 },
  { label: '重庆', value: 'chongqing', lat: 29.563, lon: 106.5516 },
  { label: '武汉', value: 'wuhan', lat: 30.5928, lon: 114.3055 },
  { label: '西安', value: 'xian', lat: 34.3416, lon: 108.9398 },
  { label: '南京', value: 'nanjing', lat: 32.0603, lon: 118.7969 },
  { label: '天津', value: 'tianjin', lat: 39.3434, lon: 117.3616 },
  { label: '苏州', value: 'suzhou', lat: 31.2989, lon: 120.5853 },
  { label: '长沙', value: 'changsha', lat: 28.2282, lon: 112.9388 },
  { label: '郑州', value: 'zhengzhou', lat: 34.7466, lon: 113.6254 },
  { label: '青岛', value: 'qingdao', lat: 36.0671, lon: 120.3826 },
  { label: '大连', value: 'dalian', lat: 38.914, lon: 121.6147 },
  { label: '厦门', value: 'xiamen', lat: 24.4798, lon: 118.0894 },
  { label: '福州', value: 'fuzhou', lat: 26.0745, lon: 119.2965 },
  { label: '济南', value: 'jinan', lat: 36.6512, lon: 117.1201 },
  { label: '沈阳', value: 'shenyang', lat: 41.8057, lon: 123.4315 },
  { label: '哈尔滨', value: 'haerbin', lat: 45.8038, lon: 126.5349 },
  { label: '昆明', value: 'kunming', lat: 24.8801, lon: 102.8329 },
  { label: '贵阳', value: 'guiyang', lat: 26.647, lon: 106.6302 },
  { label: '南宁', value: 'nanning', lat: 22.817, lon: 108.3665 },
  { label: '海口', value: 'haikou', lat: 20.044, lon: 110.1999 },
  { label: '兰州', value: 'lanzhou', lat: 36.0611, lon: 103.8343 },
  { label: '乌鲁木齐', value: 'wulumuqi', lat: 43.8256, lon: 87.6168 },
  { label: '石家庄', value: 'shijiazhuang', lat: 38.0428, lon: 114.5149 },
  { label: '合肥', value: 'hefei', lat: 31.8206, lon: 117.2272 },
  { label: '南昌', value: 'nanchang', lat: 28.682, lon: 115.8579 },
  { label: '香港', value: 'hongkong', lat: 22.3193, lon: 114.1694 },
  { label: '澳门', value: 'macao', lat: 22.1987, lon: 113.5439 },
  { label: '台北', value: 'taibei', lat: 25.033, lon: 121.5654 },
  { label: '东京', value: 'tokyo', lat: 35.6762, lon: 139.6503 },
  { label: '首尔', value: 'seoul', lat: 37.5665, lon: 126.978 },
  { label: '新加坡', value: 'singapore', lat: 1.3521, lon: 103.8198 },
  { label: '纽约', value: 'newyork', lat: 40.7128, lon: -74.006 },
  { label: '洛杉矶', value: 'losangeles', lat: 34.0522, lon: -118.2437 },
  { label: '伦敦', value: 'london', lat: 51.5074, lon: -0.1278 },
  { label: '巴黎', value: 'paris', lat: 48.8566, lon: 2.3522 },
  { label: '悉尼', value: 'sydney', lat: -33.8688, lon: 151.2093 },
];

export const cityOptions = CITIES.map(({ label, value }) => ({ label, value }));

export const cityCoord = (value: string): City | undefined =>
  CITIES.find((c) => c.value === value) || CITIES.find((c) => c.label === value);
