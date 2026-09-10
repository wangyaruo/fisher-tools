import type { AstronomyBundle, GeoPoint } from '@fisher-tools/shared'
import { computeAstronomyBundle, formatLocalDate } from '@fisher-tools/shared'
import { cache } from '../cache.js'
import { config } from '../config.js'

export interface GetAstronomyOptions {
  /** 本地日期 YYYY-MM-DD，缺省取钓点所在时区的今天 */
  date?: string
  /** 计算月亮高度角与相位的时刻，缺省该日中午 */
  at?: Date
}

/**
 * 读取天文数据。
 *
 * 缓存键包含小时刻度：同一日期下，月亮高度角会随时刻变化，
 * 若只按日期缓存，用户在傍晚查询会拿到中午的高度角。
 */
export async function getAstronomy(
  point: GeoPoint,
  options: GetAstronomyOptions = {},
): Promise<AstronomyBundle> {
  const date = options.date ?? formatLocalDate(new Date(), point.timezone)
  const hourBucket = options.at ? options.at.toISOString().slice(0, 13) : 'noon'

  const key = [
    'astronomy',
    point.latitude.toFixed(4),
    point.longitude.toFixed(4),
    point.timezone,
    date,
    hourBucket,
  ].join(':')

  return cache.wrap(key, config.cacheTtlMs, async () =>
    computeAstronomyBundle({
      date,
      timeZone: point.timezone,
      latitude: point.latitude,
      longitude: point.longitude,
      ...(options.at ? { at: options.at } : {}),
    }),
  )
}
