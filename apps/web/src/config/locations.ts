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

/** 自定义钓点在 store 与下拉列表中使用的固定 key */
export const CUSTOM_LOCATION_KEY = 'custom'

/**
 * 用户自建的钓点。与预设项的差异是没有 key 与 note：
 * 它由用户数据生成，key 固定为 CUSTOM_LOCATION_KEY。
 */
export interface CustomLocation {
  name: string
  latitude: number
  longitude: number
  timezone: string
  /** 水域类型，决定潮汐与海表数据是否相关 */
  water: '淡水' | '沿海' | '河口'
}

/** 校验并规整一份自定义钓点数据；任何字段不合法都返回 null */
export function sanitizeCustomLocation(input: unknown): CustomLocation | null {
  if (typeof input !== 'object' || input === null) return null
  const candidate = input as Record<string, unknown>

  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
  const latitude = Number(candidate.latitude)
  const longitude = Number(candidate.longitude)
  const timezone = typeof candidate.timezone === 'string' ? candidate.timezone.trim() : ''
  const water = candidate.water

  if (name.length === 0 || name.length > 20) return null
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null
  if (timezone.length === 0) return null
  if (water !== '淡水' && water !== '沿海' && water !== '河口') return null

  return { name, latitude, longitude, timezone, water }
}
