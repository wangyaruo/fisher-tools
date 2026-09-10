import type {
  DiurnalRangePoint,
  Forecast,
  GeoPoint,
  HourlyWeatherPoint,
  PressureTendency,
  PressureTrend,
} from '@fisher-tools/shared'
import { formatLocalDateTime, mean, round } from '@fisher-tools/shared'
import { cache } from '../cache.js'
import { config } from '../config.js'
import { weatherProvider } from '../providers/weather/index.js'
import type { FetchForecastOptions } from '../providers/types.js'

interface TendencyRule {
  /** 3 小时变压上限（不含） */
  max: number
  key: PressureTendency
  label: string
  interpretation: string
}

/**
 * 气压倾向判定表。
 * 阈值取 ±0.5 hPa/3h 为「稳定」、±2.5 hPa/3h 以上为「快速」，
 * 这是气象上常用的三小时变压分级口径，也与钓鱼经验中的体感分界接近。
 */
const TENDENCY_RULES: readonly TendencyRule[] = [
  {
    max: -2.5,
    key: 'rapidly_falling',
    label: '快速下降',
    interpretation:
      '气压快速下降，通常意味着低压系统或强对流逼近。鱼类常在此前加大摄食，短时鱼口可能明显转好，但天气也将迅速转坏，务必留意雷电与大风。',
  },
  {
    max: -0.5,
    key: 'falling',
    label: '缓慢下降',
    interpretation:
      '气压缓慢下降，是公认最有利的窗口：溶氧尚可，鱼类摄食意愿上升，适合优先安排出钓。',
  },
  {
    max: 0.5,
    key: 'steady',
    label: '基本稳定',
    interpretation: '气压基本稳定，鱼情更多由水温与日照节律决定，属常规条件。',
  },
  {
    max: 2.5,
    key: 'rising',
    label: '缓慢上升',
    interpretation: '气压缓慢回升，鱼群需一段时间适应，开口可能偏轻、偏慢，宜减小饵团并放慢节奏。',
  },
  {
    max: Number.POSITIVE_INFINITY,
    key: 'rapidly_rising',
    label: '快速上升',
    interpretation:
      '气压快速上升，鱼群普遍下沉、开口变差。宜钓深钓远，或直接改期；这是最不利的变压方向。',
  },
]

/** 读取预报，带 TTL 缓存与并发去重。 */
export async function getForecast(
  point: GeoPoint,
  options?: FetchForecastOptions,
): Promise<Forecast> {
  const key = [
    'forecast',
    weatherProvider.name,
    point.latitude.toFixed(4),
    point.longitude.toFixed(4),
    point.timezone,
    `d${options?.forecastDays ?? 7}`,
    `p${options?.pastDays ?? 1}`,
  ].join(':')
  return cache.wrap(key, config.cacheTtlMs, () => weatherProvider.fetchForecast(point, options))
}

/** 在逐小时序列中定位目标时刻所在的小时索引。 */
export function indexOfHour(
  series: readonly HourlyWeatherPoint[],
  at: Date,
  timeZone: string,
): number {
  if (series.length === 0) return -1
  const target = formatLocalDateTime(at, timeZone).slice(0, 13)
  const exact = series.findIndex((point) => point.time.slice(0, 13) === target)
  if (exact >= 0) return exact
  // 目标时刻落在序列范围之外时退化为最近端点，避免直接失败；
  // 前端可通过返回的 inputs.at 与实际序列首尾时间自行判断是否越界
  const first = series[0]!.time.slice(0, 13)
  return first > target ? 0 : series.length - 1
}

/**
 * 计算气压趋势。
 * 变压一律定义为「当前值 − 过去值」，因此负值代表气压正在下降，
 * 与评分模型中的 delta3h 口径保持一致。
 */
export function computePressureTrend(
  forecast: Forecast,
  at: Date,
  timeZone: string,
): PressureTrend {
  const series = forecast.hourly
  const index = indexOfHour(series, at, timeZone)
  if (index < 0) {
    throw new Error('预报序列为空，无法计算气压趋势')
  }
  const current = series[index]!.surfacePressure

  const delta = (hours: number): number | null => {
    const past = series[index - hours]
    if (!past) return null
    return round(current - past.surfacePressure, 2)
  }

  const delta1h = delta(1)
  const delta3h = delta(3)
  const delta6h = delta(6)
  const delta12h = delta(12)

  const rule = TENDENCY_RULES.find((item) => delta3h === null || delta3h < item.max)! as TendencyRule

  return {
    current: round(current, 1),
    delta1h,
    delta3h,
    delta6h,
    delta12h,
    ratePerHour: delta3h === null ? null : round(delta3h / 3, 2),
    tendency: rule.key,
    tendencyLabel: rule.label,
    interpretation: rule.interpretation,
  }
}

/**
 * 计算逐日昼夜温差。
 *
 * 日最高/最低温取上游 daily 数据（由上游按完整日聚合，更权威）；
 * 日间与夜间均值则由逐小时的 is_day 标记聚合而来，
 * 因为「昼夜温差曲线」关心的是昼夜两个时段的平均差距，而非极值之差。
 */
export function computeDiurnalRanges(forecast: Forecast): DiurnalRangePoint[] {
  const grouped = new Map<string, HourlyWeatherPoint[]>()
  for (const point of forecast.hourly) {
    const date = point.time.slice(0, 10)
    const bucket = grouped.get(date)
    if (bucket) bucket.push(point)
    else grouped.set(date, [point])
  }

  const dailyByDate = new Map(forecast.daily.map((item) => [item.date, item]))

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => {
      const temperatures = points.map((point) => point.temperature)
      const daily = dailyByDate.get(date)
      const max = daily?.temperatureMax ?? Math.max(...temperatures)
      const min = daily?.temperatureMin ?? Math.min(...temperatures)

      const dayMean = mean(points.filter((p) => p.isDay).map((p) => p.temperature))
      const nightMean = mean(points.filter((p) => !p.isDay).map((p) => p.temperature))
      // 逐小时数据若覆盖不满一天（序列首尾日），某个时段可能为空，
      // 此时用日极值中值兜底，并在前端标注该日数据不完整
      const fallback = (max + min) / 2
      const day = dayMean ?? fallback
      const night = nightMean ?? fallback

      return {
        date,
        max: round(max, 1),
        min: round(min, 1),
        range: round(max - min, 1),
        dayMean: round(day, 1),
        nightMean: round(night, 1),
        dayNightDelta: round(day - night, 1),
      }
    })
}
