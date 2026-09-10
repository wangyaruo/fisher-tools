import type { GeoPoint } from '@fisher-tools/shared'
import { zonedTimeToUtc } from '@fisher-tools/shared'
import type { FastifyInstance } from 'fastify'
import { computeDiurnalRanges, computePressureTrend, getForecast, indexOfHour } from '../services/forecast.service.js'
import { DatedPointQuerySchema, PointQuerySchema, parseQuery } from './query.js'

function toGeoPoint(query: { latitude: number; longitude: number; timezone: string; name?: string }): GeoPoint {
  return {
    latitude: query.latitude,
    longitude: query.longitude,
    timezone: query.timezone,
    ...(query.name ? { name: query.name } : {}),
  }
}

/**
 * 解析时刻参数。
 * 传入的 at 是「本地墙上时间」（如 2026-09-10T14:00），必须按钓点所在时区
 * 解释为绝对时刻；直接用 new Date() 会按进程时区解析，在非东八区部署时整体偏移。
 */
function resolveAt(at: string | undefined, timeZone: string): Date {
  return at ? zonedTimeToUtc(at, timeZone) : new Date()
}

export function registerForecastRoutes(app: FastifyInstance): void {
  app.get('/api/forecast', async (request) => {
    const query = parseQuery(PointQuerySchema, request.query)
    return getForecast(toGeoPoint(query))
  })

  app.get('/api/forecast/pressure-trend', async (request) => {
    const query = parseQuery(DatedPointQuerySchema, request.query)
    const forecast = await getForecast(toGeoPoint(query))
    const at = resolveAt(query.at, query.timezone)
    return {
      location: forecast.location,
      source: forecast.source,
      at: query.at ?? at.toISOString(),
      trend: computePressureTrend(forecast, at, query.timezone),
    }
  })

  app.get('/api/forecast/diurnal-range', async (request) => {
    const query = parseQuery(PointQuerySchema, request.query)
    const forecast = await getForecast(toGeoPoint(query))
    return {
      location: forecast.location,
      source: forecast.source,
      ranges: computeDiurnalRanges(forecast),
    }
  })

  /** 指定时刻的逐小时要素，供总览页展示「此刻」的天气卡片。 */
  app.get('/api/forecast/at', async (request) => {
    const query = parseQuery(DatedPointQuerySchema, request.query)
    const forecast = await getForecast(toGeoPoint(query))
    const at = resolveAt(query.at, query.timezone)
    const index = indexOfHour(forecast.hourly, at, query.timezone)
    return {
      location: forecast.location,
      source: forecast.source,
      hour: index >= 0 ? forecast.hourly[index] : null,
      marine: index >= 0 ? (forecast.marine[index] ?? null) : null,
    }
  })
}
