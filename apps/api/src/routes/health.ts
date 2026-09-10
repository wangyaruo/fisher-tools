import type { FastifyInstance } from 'fastify'
import { cache } from '../cache.js'
import { config } from '../config.js'

const startedAt = Date.now()

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/health', async () => ({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    cache: cache.stats(),
  }))

  app.get('/', async () => ({
    name: 'fisher-tools-api',
    description: '钓鱼助手后端：气象、天文、潮汐与钓鱼指数',
    attribution: config.attribution,
    endpoints: [
      'GET /health',
      'GET /api/forecast?latitude=&longitude=&timezone=',
      'GET /api/forecast/pressure-trend?latitude=&longitude=&timezone=&at=',
      'GET /api/astronomy?latitude=&longitude=&timezone=&date=',
      'GET /api/tide?latitude=&longitude=&timezone=&date=',
      'GET /api/fishing-index?latitude=&longitude=&timezone=&at=',
      'GET /api/overview?latitude=&longitude=&timezone=',
      'GET /api/knowledge',
      'GET /api/knowledge/search?q=',
      'GET /api/knowledge/:slug',
    ],
  }))
}
