import type { GeoPoint, TidePrediction } from '@fisher-tools/shared'
import { formatLocalDate } from '@fisher-tools/shared'
import { cache } from '../cache.js'
import { config } from '../config.js'
import { getTideProvider } from '../providers/tide/index.js'
import { getForecast } from './forecast.service.js'

/**
 * 判定钓点是否沿海。
 *
 * 判据是上游是否返回了有效的浪高与海表水温，而不是按坐标做「离海多远」的
 * 几何估算：几何估算对海湾、河口、大型湖库都不可靠，
 * 而海表数据是「这片水域确实被当作海域建模」的直接证据。
 *
 * 调用方可用 coastal 参数显式覆盖（例如已知的入海口钓点）。
 */
async function resolveCoastal(point: GeoPoint, explicit?: boolean): Promise<boolean> {
  if (explicit !== undefined) return explicit
  try {
    const forecast = await getForecast(point)
    return forecast.hasMarineData
  } catch {
    // 沿海判定失败不应让整个潮汐请求失败，退化为「未知按沿海处理」，
    // 因为天文潮窗口对内陆钓点同样成立，只是前端默认不展示
    return true
  }
}

export interface GetTideOptions {
  /** 本地日期 YYYY-MM-DD，缺省取钓点所在时区的今天 */
  date?: string
  coastal?: boolean
}

export async function getTide(point: GeoPoint, options: GetTideOptions = {}): Promise<TidePrediction> {
  const date = options.date ?? formatLocalDate(new Date(), point.timezone)
  const provider = getTideProvider()
  const isCoastal = await resolveCoastal(point, options.coastal)

  const key = [
    'tide',
    provider.kind,
    point.latitude.toFixed(4),
    point.longitude.toFixed(4),
    point.timezone,
    date,
    isCoastal ? 'coastal' : 'inland',
  ].join(':')

  return cache.wrap(key, config.cacheTtlMs, () =>
    provider.fetchTide({ point, date, isCoastal }),
  )
}
