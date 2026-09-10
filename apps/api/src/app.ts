import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { registerAstronomyRoutes } from './routes/astronomy.js'
import { registerForecastRoutes } from './routes/forecast.js'
import { registerHealthRoutes } from './routes/health.js'

/** 上游数据源不可用或返回异常结构时抛出，由错误处理器统一映射为 502。 */
export class UpstreamError extends Error {
  readonly source: string

  constructor(message: string, source: string, cause?: unknown) {
    // 复用 Error 自带的标准 cause 字段，便于日志链路追踪
    super(message, { cause })
    this.name = 'UpstreamError'
    this.source = source
  }
}

/** 请求参数不合法时抛出，映射为 400。 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  })

  await app.register(cors, { origin: true })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.warn({ issues: error.issues }, '响应结构校验失败')
      return reply.status(502).send({
        error: 'UpstreamSchemaMismatch',
        message: '上游数据结构与预期不符，可能是数据源接口发生了变更',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    if (error instanceof UpstreamError) {
      request.log.error({ err: error, source: error.source }, '上游数据源请求失败')
      return reply.status(502).send({
        error: 'UpstreamUnavailable',
        source: error.source,
        message: error.message,
      })
    }

    if (error instanceof BadRequestError) {
      return reply.status(400).send({ error: 'BadRequest', message: error.message })
    }

    request.log.error({ err: error }, '未预期的服务端错误')
    return reply.status(500).send({ error: 'InternalError', message: '服务端内部错误' })
  })

  // 健康检查与自描述信息挂在根路径，便于容器探针直接使用
  registerHealthRoutes(app)

  // 业务接口统一挂在 /api 前缀下
  registerForecastRoutes(app)
  registerAstronomyRoutes(app)

  return app
}
