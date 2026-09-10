import type { FishingIndex, GeoPoint, TideWindowKind } from '@fisher-tools/shared'
import { formatLocalDate, scoreFishingIndex } from '@fisher-tools/shared'
import { getAstronomy } from './astronomy.service.js'
import { computeDiurnalRanges, computePressureTrend, getForecast, indexOfHour } from './forecast.service.js'
import { getTide } from './tide.service.js'

export interface GetFishingIndexOptions {
  /** 评分针对的时刻，缺省为当前时刻 */
  at?: Date
}

/**
 * 计算钓鱼指数。
 *
 * 这是全站唯一把气象、天文、潮汐三路数据合到一起的地方：
 * 评分算法本体在 packages/shared 中，前端与服务端共用同一份实现，
 * 因此同一组输入必然得到同一个分数，不存在两端算不一致的可能。
 */
export async function getFishingIndex(
  point: GeoPoint,
  options: GetFishingIndexOptions = {},
): Promise<{ index: FishingIndex; forecastDate: string }> {
  const at = options.at ?? new Date()
  const localDate = formatLocalDate(at, point.timezone)

  const forecast = await getForecast(point)
  const [astronomy, tide] = await Promise.all([
    getAstronomy(point, { date: localDate, at }),
    getTide(point, { date: localDate }),
  ])

  const center = indexOfHour(forecast.hourly, at, point.timezone)
  const weather = center >= 0 ? (forecast.hourly[center] ?? null) : null
  const marine = center >= 0 ? (forecast.marine[center] ?? null) : null
  const diurnalRange = computeDiurnalRanges(forecast).find((range) => range.date === localDate) ?? null

  // 由潮汐窗口反推当前处于大潮/中潮/小潮，供评分因子使用
  const tideWindowKind: TideWindowKind | null =
    tide.windows.find((window) => window.start.slice(0, 10) <= localDate && localDate <= window.end.slice(0, 10))
      ?.kind ?? null

  const index = scoreFishingIndex({
    at,
    timeZone: point.timezone,
    location: { latitude: point.latitude, longitude: point.longitude },
    weather,
    pressureTrend: computePressureTrend(forecast, at, point.timezone),
    diurnalRange,
    marine,
    moon: astronomy.moon,
    solunar: astronomy.solunar,
    sun: astronomy.sun,
    tideWindowKind,
  })

  return { index, forecastDate: localDate }
}
