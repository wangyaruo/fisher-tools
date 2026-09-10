import { z } from 'zod'

/**
 * 地理坐标与查询上下文。
 * timezone 显式声明，避免上游按 UTC 返回导致日出日落时间整体偏移。
 */
export const GeoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
  timezone: z.string().default('Asia/Shanghai'),
})
export type GeoPoint = z.infer<typeof GeoPointSchema>

/** 逐小时气象要素。字段口径对应 Open-Meteo 的同名字段，单位统一为公制。 */
export const HourlyWeatherPointSchema = z.object({
  /** 本地时间，形如 2026-09-10T14:00 */
  time: z.string(),
  /** 2 米气温，°C */
  temperature: z.number(),
  /** 体感温度，°C */
  apparentTemperature: z.number(),
  /** 露点温度，°C。露点接近气温说明湿度饱和，常见于清晨起雾 */
  dewPoint: z.number(),
  /** 相对湿度，% */
  relativeHumidity: z.number(),
  /** 站点气压，hPa。钓鱼场景关注的是它，而非海平面气压 */
  surfacePressure: z.number(),
  /** 海平面气压，hPa。用于跨海拔比较 */
  pressureMsl: z.number(),
  /** 10 米风速，km/h */
  windSpeed: z.number(),
  /** 阵风风速，km/h */
  windGust: z.number(),
  /** 风向，度，气象学定义（风来的方向） */
  windDirection: z.number(),
  /** 总云量，% */
  cloudCover: z.number(),
  /** 该小时降水量，mm */
  precipitation: z.number(),
  /** 降水概率，% */
  precipitationProbability: z.number(),
  /** 能见度，m */
  visibility: z.number(),
  /** 紫外线指数 */
  uvIndex: z.number(),
  /** 白昼标记，驱动昼夜温差与光照判断 */
  isDay: z.boolean(),
})
export type HourlyWeatherPoint = z.infer<typeof HourlyWeatherPointSchema>

/** 逐日汇总。温差与日月出没放在日粒度上更贴近出钓决策。 */
export const DailyWeatherPointSchema = z.object({
  /** 本地日期，形如 2026-09-10 */
  date: z.string(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  precipitationSum: z.number(),
  precipitationProbabilityMax: z.number(),
  /** 当日最大风速，km/h */
  windSpeedMax: z.number(),
  windGustsMax: z.number(),
  /** 当日主导风向，度 */
  windDirectionDominant: z.number(),
  uvIndexMax: z.number(),
})
export type DailyWeatherPoint = z.infer<typeof DailyWeatherPointSchema>

/**
 * 逐小时海洋要素。内陆钓点通常拿不到数据，因此各字段允许为 null，
 * 由上层判断「是否沿海」并降级处理。
 */
export const MarineHourlyPointSchema = z.object({
  time: z.string(),
  waveHeight: z.number().nullable(),
  wavePeriod: z.number().nullable(),
  waveDirection: z.number().nullable(),
  seaSurfaceTemperature: z.number().nullable(),
})
export type MarineHourlyPoint = z.infer<typeof MarineHourlyPointSchema>

/** 一次完整的预报聚合结果，是前端数据看板的主要数据源。 */
export const ForecastSchema = z.object({
  location: GeoPointSchema,
  /** 数据抓取时刻，ISO8601 带时区 */
  fetchedAt: z.string(),
  /** 标注来源与许可，前端需展示 */
  source: z.string(),
  /** 是否包含海洋数据 */
  hasMarineData: z.boolean(),
  hourly: z.array(HourlyWeatherPointSchema),
  daily: z.array(DailyWeatherPointSchema),
  marine: z.array(MarineHourlyPointSchema),
})
export type Forecast = z.infer<typeof ForecastSchema>

/** 气压变化趋势。变压方向与速率是钓鱼场景里权重最高的气象因子。 */
export const PressureTendencyEnum = z.enum([
  'rapidly_falling',
  'falling',
  'steady',
  'rising',
  'rapidly_rising',
])
export type PressureTendency = z.infer<typeof PressureTendencyEnum>

export const PressureTrendSchema = z.object({
  /** 当前站点气压，hPa */
  current: z.number(),
  /** 各时间窗口的变压，hPa。窗口数据不足时为 null */
  delta1h: z.number().nullable(),
  delta3h: z.number().nullable(),
  delta6h: z.number().nullable(),
  delta12h: z.number().nullable(),
  /** 近 3 小时平均变压速率，hPa/h */
  ratePerHour: z.number().nullable(),
  tendency: PressureTendencyEnum,
  tendencyLabel: z.string(),
  /** 对鱼情影响的通俗解释，前端直接展示 */
  interpretation: z.string(),
})
export type PressureTrend = z.infer<typeof PressureTrendSchema>

/** 昼夜温差。曲线由逐日数据构成，夜间与日间均值用于刻画水温稳定性。 */
export const DiurnalRangePointSchema = z.object({
  date: z.string(),
  max: z.number(),
  min: z.number(),
  /** 日最高温与最低温之差，°C */
  range: z.number(),
  /** 白昼时段平均气温，°C */
  dayMean: z.number(),
  /** 夜间时段平均气温，°C */
  nightMean: z.number(),
  /** 昼夜均温差，°C */
  dayNightDelta: z.number(),
})
export type DiurnalRangePoint = z.infer<typeof DiurnalRangePointSchema>
