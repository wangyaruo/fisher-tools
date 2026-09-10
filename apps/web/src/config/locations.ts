export interface PresetLocation {
  key: string
  name: string
  latitude: number
  longitude: number
  timezone: string
  /** 水域类型，决定潮汐与海表数据是否相关 */
  water: '淡水' | '沿海' | '河口'
  note?: string
}

/**
 * 预设钓点。
 * 中国全境统一使用东八区，因此时区固定为 Asia/Shanghai，
 * 但经度跨越 60 度以上，日出日落差异显著——这也是本站把
 * 黄金时段按经度实算而不是按「早六晚六」给固定值的原因。
 */
export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    key: 'shenzhen',
    name: '深圳',
    latitude: 22.5431,
    longitude: 114.0579,
    timezone: 'Asia/Shanghai',
    water: '沿海',
    note: '常驻地',
  },
  {
    key: 'tangxia',
    name: '东莞塘厦',
    latitude: 22.8155,
    longitude: 114.1047,
    timezone: 'Asia/Shanghai',
    water: '淡水',
    note: '水库与山塘居多',
  },
  {
    key: 'huizhou',
    name: '惠州',
    latitude: 23.1115,
    longitude: 114.4161,
    timezone: 'Asia/Shanghai',
    water: '淡水',
  },
  {
    key: 'guangzhou',
    name: '广州',
    latitude: 23.1291,
    longitude: 113.2644,
    timezone: 'Asia/Shanghai',
    water: '河口',
  },
  {
    key: 'shantou',
    name: '汕头',
    latitude: 23.354,
    longitude: 116.682,
    timezone: 'Asia/Shanghai',
    water: '沿海',
  },
  {
    key: 'changsha',
    name: '长沙',
    latitude: 28.2282,
    longitude: 112.9388,
    timezone: 'Asia/Shanghai',
    water: '淡水',
  },
  {
    key: 'urumqi',
    name: '乌鲁木齐',
    latitude: 43.8256,
    longitude: 87.6168,
    timezone: 'Asia/Shanghai',
    water: '淡水',
    note: '经度差异大，日出日落明显偏晚',
  },
]

export const DEFAULT_LOCATION_KEY = 'shenzhen'
