import { zonedTimeToUtc } from '@fisher-tools/shared'
import type { FastifyInstance } from 'fastify'
import { getAstronomy } from '../services/astronomy.service.js'
import { computeDiurnalRanges, computePressureTrend, getForecast, indexOfHour } from '../services/forecast.service.js'
import { getFishingIndex } from '../services/fishing-index.service.js'
import { getTide } from '../services/tide.service.js'
import { DatedPointQuerySchema, parseQuery } from './query.js'

/** 总览页图表所需的逐小时窗口：目标时刻前 6 小时至其后 66 小时，共 72 小时 */
const CHART_HOURS_BEFORE = 6
const CHART_WINDOW_HOURS = 72

function toGeoPoint(query: { latitude: number; longitude: number; timezone: string; name?: string }) {
  return {
    latitude: query.latitude,
    longitude: query.longitude,
    timezone: query.timezone,
    ...(query.name ? { name: query.name } : {}),
  }
}

function resolveAt(at: string | undefined, timeZone: string): Date {
  return at ? zonedTimeToUtc(at, timeZone) : new Date()
}

export function registerFishingIndexRoutes(app: FastifyInstance): void {
  app.get('/api/fishing-index', async (request) => {
    const query = parseQuery(DatedPointQuerySchema, request.query)
    const at = resolveAt(query.at, query.timezone)
    const { index } = await getFishingIndex(toGeoPoint(query), { at })
    return index
  })

  /**
   * 总览接口：一次返回总览页所需的全部数据。
   *
   * 之所以做成聚合接口而不是让前端并发打四个端点：
   * 四个端点各自会触发相同的气象请求，虽然服务端有缓存与并发去重，
   * 但四个往返的延迟叠加仍会明显拖慢首屏；聚合后只有一次往返。
   */
  app.get('/api/overview', async (request) => {
    const query = parseQuery(DatedPointQuerySchema, request.query)
    const point = toGeoPoint(query)
    const at = resolveAt(query.at, query.timezone)

    const forecast = await getForecast(point)
    const center = indexOfHour(forecast.hourly, at, query.timezone)
    const localDate = (forecast.hourly[center]?.time ?? '').slice(0, 10) || undefined

    const [astronomy, tide, fishing] = await Promise.all([
      getAstronomy(point, { ...(localDate ? { date: localDate } : {}), at }),
      getTide(point, { ...(localDate ? { date: localDate } : {}) }),
      getFishingIndex(point, { at }),
    ])

    const from = Math.max(0, center - CHART_HOURS_BEFORE)
    const to = Math.min(forecast.hourly.length, from + CHART_WINDOW_HOURS)

    return {
      location: forecast.location,
      at: at.toISOString(),
      sources: {
        weather: forecast.source,
        astronomy: 'astronomy-engine 本地计算',
        tide: tide.providerName,
      },
      fishingIndex: fishing.index,
      current: {
        weather: center >= 0 ? (forecast.hourly[center] ?? null) : null,
        marine: center >= 0 ? (forecast.marine[center] ?? null) : null,
      },
      pressureTrend: computePressureTrend(forecast, at, query.timezone),
      diurnalRanges: computeDiurnalRanges(forecast),
      hourlyWindow: {
        from: forecast.hourly[from]?.time ?? null,
        to: forecast.hourly[to - 1]?.time ?? null,
        weather: forecast.hourly.slice(from, to),
        marine: forecast.marine.slice(from, to),
      },
      daily: forecast.daily,
      astronomy,
      tide,
    }
  })
}
