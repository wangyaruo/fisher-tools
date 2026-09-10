import { KNOWLEDGE_CATEGORY_LABEL, KnowledgeCategoryEnum } from '@fisher-tools/shared'
import type { FastifyInstance } from 'fastify'
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

export function registerKnowledgeRoutes(app: FastifyInstance): void {
  /** 分类清单，供前端渲染导航 */
  app.get('/api/knowledge/categories', async () =>
    Object.entries(KNOWLEDGE_CATEGORY_LABEL).map(([key, label]) => ({ key, label })),
  )

  app.get('/api/knowledge', async (request) => {
    const query = parseQuery(ListQuerySchema, request.query)
    const items = await listKnowledge(query.category)
    return { total: items.length, items }
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
    return doc
  })
}
