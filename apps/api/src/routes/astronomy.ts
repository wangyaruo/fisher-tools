import { zonedTimeToUtc } from '@fisher-tools/shared'
import type { FastifyInstance } from 'fastify'
import { getAstronomy } from '../services/astronomy.service.js'
import { DatedPointQuerySchema, parseQuery } from './query.js'

export function registerAstronomyRoutes(app: FastifyInstance): void {
  app.get('/api/astronomy', async (request) => {
    const query = parseQuery(DatedPointQuerySchema, request.query)

    const bundle = await getAstronomy(
      {
        latitude: query.latitude,
        longitude: query.longitude,
        timezone: query.timezone,
        ...(query.name ? { name: query.name } : {}),
      },
      {
        ...(query.date ? { date: query.date } : {}),
        ...(query.at ? { at: zonedTimeToUtc(query.at, query.timezone) } : {}),
      },
    )

    return {
      ...bundle,
      location: {
        latitude: query.latitude,
        longitude: query.longitude,
        timezone: query.timezone,
        ...(query.name ? { name: query.name } : {}),
      },
    }
  })
}
