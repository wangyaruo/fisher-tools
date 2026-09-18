import { createHash } from 'node:crypto'
import { KNOWLEDGE_CATEGORY_LABEL, KnowledgeCategoryEnum } from '@fisher-tools/shared'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { getKnowledgeDoc, listKnowledge, searchKnowledge } from '../services/knowledge.service.js'
import { parseQuery } from './query.js'

const ListQuerySchema = z.object({
  category: KnowledgeCategoryEnum.optional(),
})

const SearchQuerySchema = z.object({
  q: z.string().min(1, '检索词不能为空').max(64),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

/**
 * 知识库内容只随部署变化：列表、分类与正文可加 HTTP 缓存。
 * max-age 取较短的 300 秒，浏览器过期后携带 ETag 重验证，
 * 内容未变时只需一次 304 往返，变更也能在 5 分钟内生效。
 * 检索结果与查询词相关，不加缓存。
 */
const CACHE_CONTROL = 'public, max-age=300'

function etagOf(payload: unknown): string {
  const digest = createHash('sha1').update(JSON.stringify(payload)).digest('base64url')
  return `W/"${digest}"`
}

/** 发送可缓存响应：ETag 命中时返回 304，否则正常下发并带上缓存头。 */
function sendCacheable(request: FastifyRequest, reply: FastifyReply, payload: unknown): unknown {
  const etag = etagOf(payload)
  reply.header('cache-control', CACHE_CONTROL).header('etag', etag)
  if (request.headers['if-none-match'] === etag) {
    return reply.status(304).send()
  }
  return payload
}

export function registerKnowledgeRoutes(app: FastifyInstance): void {
  /** 分类清单，供前端渲染导航 */
  app.get('/api/knowledge/categories', async (request, reply) =>
    sendCacheable(
      request,
      reply,
      Object.entries(KNOWLEDGE_CATEGORY_LABEL).map(([key, label]) => ({ key, label })),
    ),
  )

  app.get('/api/knowledge', async (request, reply) => {
    const query = parseQuery(ListQuerySchema, request.query)
    const items = await listKnowledge(query.category)
    return sendCacheable(request, reply, { total: items.length, items })
  })

  // 静态路径必须先于参数路径注册，避免 search 被当作 slug 匹配
  app.get('/api/knowledge/search', async (request) => {
    const query = parseQuery(SearchQuerySchema, request.query)
    return searchKnowledge(query.q, query.limit)
  })

  app.get('/api/knowledge/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const doc = await getKnowledgeDoc(slug)
    if (!doc) {
      return reply.status(404).send({
        error: 'NotFound',
        message: `知识库中不存在 slug 为「${slug}」的文档`,
      })
    }
    return sendCacheable(request, reply, doc)
  })
}
