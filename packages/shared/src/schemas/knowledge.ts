import { z } from 'zod'

/** 知识库分类。与导航层级一一对应，避免内容堆积成单层长列表。 */
export const KnowledgeCategoryEnum = z.enum([
  'species',
  'rig',
  'bait',
  'technique',
  'season',
  'safety',
  'regulation',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategoryEnum>

export const KNOWLEDGE_CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  species: '鱼种习性',
  rig: '线组与装备',
  bait: '饵料与窝料',
  technique: '钓法与技巧',
  season: '季节与时令',
  safety: '安全须知',
  regulation: '法规与禁渔期',
}

/** 知识库文档。正文为 Markdown，前端按需渲染。 */
export const KnowledgeDocSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: KnowledgeCategoryEnum,
  categoryLabel: z.string(),
  tags: z.array(z.string()),
  /** 列表页摘要 */
  summary: z.string(),
  /** 同分类内排序权重，数值越小越靠前 */
  order: z.number().default(0),
  updatedAt: z.string().optional(),
  /** Markdown 正文，不含 frontmatter */
  body: z.string(),
  /** 正文纯文本长度，用于展示篇幅 */
  wordCount: z.number(),
})
export type KnowledgeDoc = z.infer<typeof KnowledgeDocSchema>

/** 知识库检索命中项。命中片段已从正文中截取，便于前端高亮。 */
export const KnowledgeHitSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: KnowledgeCategoryEnum,
  categoryLabel: z.string(),
  /** 命中片段，前后各取若干字符 */
  snippet: z.string(),
  /** 命中次数，用于排序 */
  hitCount: z.number(),
})
export type KnowledgeHit = z.infer<typeof KnowledgeHitSchema>

export const KnowledgeSearchResultSchema = z.object({
  query: z.string(),
  total: z.number(),
  hits: z.array(KnowledgeHitSchema),
})
export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>
