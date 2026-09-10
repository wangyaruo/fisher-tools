import type { FastifyInstance } from 'fastify'
import { getTide } from '../services/tide.service.js'
import { DatedPointQuerySchema, parseQuery } from './query.js'
import { z } from 'zod'

const TideQuerySchema = DatedPointQuerySchema.extend({
  /** 显式指定是否沿海，缺省由上游海表数据自动判定 */
  coastal: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
})

export function registerTideRoutes(app: FastifyInstance): void {
  app.get('/api/tide', async (request) => {
    const query = parseQuery(TideQuerySchema, request.query)
    return getTide(
      {
        latitude: query.latitude,
        longitude: query.longitude,
        timezone: query.timezone,
        ...(query.name ? { name: query.name } : {}),
      },
      {
        ...(query.date ? { date: query.date } : {}),
        ...(query.coastal === undefined ? {} : { coastal: query.coastal }),
      },
    )
  })
}
