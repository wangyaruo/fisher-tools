import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, join } from 'node:path'
import { z } from 'zod'
import {
  KNOWLEDGE_CATEGORY_LABEL,
  KnowledgeCategoryEnum,
  type KnowledgeCategory,
  type KnowledgeDoc,
  type KnowledgeHit,
  type KnowledgeSearchResult,
} from '@fisher-tools/shared'

/** 知识库内容目录。放在 src 下随源码一起分发，不依赖运行时写盘。 */
const KNOWLEDGE_DIR = fileURLToPath(new URL('../data/knowledge/', import.meta.url))

const FrontmatterSchema = z.object({
  title: z.string().min(1, 'title 不能为空'),
  category: KnowledgeCategoryEnum,
  tags: z.array(z.string()).default([]),
  summary: z.string().min(1, 'summary 不能为空'),
  order: z.coerce.number().int().default(0),
  updatedAt: z.string().optional(),
})

type Frontmatter = z.infer<typeof FrontmatterSchema>

/** 解析 frontmatter。仅支持扁平的「键: 值」结构，`tags` 额外支持数组写法。 */
function parseFrontmatter(raw: string, file: string): { data: Record<string, string>; body: string } {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) {
    throw new Error(`知识库文件 ${file} 缺少 frontmatter，应以 --- 开始并以 --- 结束`)
  }

  const data: Record<string, string> = {}
  for (const line of match[1]!.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf(':')
    if (separator < 0) {
      throw new Error(`${file}: frontmatter 行应为「键: 值」，实际为「${trimmed}」`)
    }
    data[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim()
  }

  return { data, body: text.slice(match[0].length) }
}

function parseTags(value: string | undefined): string[] {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/** 中英混排的正文字数：中日韩字符逐字计，拉丁字母按单词计。 */
function countWords(body: string): number {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`|_\-[\]]/g, ' ')
  const cjk = (plain.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const latin = (plain.match(/[A-Za-z]+/g) ?? []).length
  return cjk + latin
}

async function readAllDocs(): Promise<KnowledgeDoc[]> {
  let files: string[]
  try {
    files = await readdir(KNOWLEDGE_DIR)
  } catch (error) {
    throw new Error(`无法读取知识库目录 ${KNOWLEDGE_DIR}：${(error as Error).message}`)
  }

  const markdownFiles = files.filter((file) => extname(file) === '.md').sort()
  if (markdownFiles.length === 0) {
    throw new Error(`知识库目录 ${KNOWLEDGE_DIR} 中没有任何 .md 文件`)
  }

  const docs = await Promise.all(
    markdownFiles.map(async (file): Promise<KnowledgeDoc> => {
      const raw = await readFile(join(KNOWLEDGE_DIR, file), 'utf8')
      const { data, body } = parseFrontmatter(raw, file)
      const parsed = FrontmatterSchema.safeParse({
        ...data,
        tags: parseTags(data.tags),
      })
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((issue) => `${issue.path.join('.') || '字段'}: ${issue.message}`)
          .join('；')
        throw new Error(`知识库文件 ${file} 的 frontmatter 不合法 —— ${detail}`)
      }

      const meta: Frontmatter = parsed.data
      return {
        slug: file.replace(/\.md$/, ''),
        title: meta.title,
        category: meta.category,
        categoryLabel: KNOWLEDGE_CATEGORY_LABEL[meta.category],
        tags: meta.tags,
        summary: meta.summary,
        order: meta.order,
        ...(meta.updatedAt ? { updatedAt: meta.updatedAt } : {}),
        body: body.trim(),
        wordCount: countWords(body),
      }
    }),
  )

  const order = Object.keys(KNOWLEDGE_CATEGORY_LABEL) as KnowledgeCategory[]
  return docs.sort((a, b) => {
    const byCategory = order.indexOf(a.category) - order.indexOf(b.category)
    if (byCategory !== 0) return byCategory
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title, 'zh-Hans-CN')
  })
}

let cache: Promise<KnowledgeDoc[]> | null = null

/** 读取全部文档，进程内只解析一次。解析失败不缓存，避免一次瞬时错误被永久固化。 */
export function loadKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  if (!cache) {
    cache = readAllDocs().catch((error: unknown) => {
      cache = null
      throw error
    })
  }
  return cache
}

export type KnowledgeListItem = Omit<KnowledgeDoc, 'body'>

function toListItem(doc: KnowledgeDoc): KnowledgeListItem {
  const { body: _body, ...rest } = doc
  return rest
}

export async function listKnowledge(category?: KnowledgeCategory): Promise<KnowledgeListItem[]> {
  const docs = await loadKnowledgeDocs()
  return docs.filter((doc) => !category || doc.category === category).map(toListItem)
}

export async function getKnowledgeDoc(slug: string): Promise<KnowledgeDoc | null> {
  const docs = await loadKnowledgeDocs()
  return docs.find((doc) => doc.slug === slug) ?? null
}

function snippetAround(body: string, query: string, radius = 60): string {
  const plain = body.replace(/\s+/g, ' ')
  const index = plain.toLowerCase().indexOf(query.toLowerCase())
  if (index < 0) {
    return `${plain.slice(0, radius * 2).trim()}…`
  }
  const start = Math.max(0, index - radius)
  const end = Math.min(plain.length, index + query.length + radius)
  return `${start > 0 ? '…' : ''}${plain.slice(start, end).trim()}${end < plain.length ? '…' : ''}`
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0
  const lowerHaystack = haystack.toLowerCase()
  const lowerNeedle = needle.toLowerCase()
  let count = 0
  let position = lowerHaystack.indexOf(lowerNeedle)
  while (position >= 0) {
    count += 1
    position = lowerHaystack.indexOf(lowerNeedle, position + lowerNeedle.length)
  }
  return count
}

/**
 * 全文检索。
 * 采用加权子串匹配而不引入分词：知识库为中英混排的小体量静态内容，
 * 子串匹配对中文无需分词即可工作，且结果可解释、无依赖。
 * 标题命中权重 3、标签权重 2、正文权重 1，据此排序。
 */
export async function searchKnowledge(query: string, limit = 20): Promise<KnowledgeSearchResult> {
  const docs = await loadKnowledgeDocs()
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return { query: trimmed, total: 0, hits: [] }
  }

  const scored = docs
    .map((doc) => {
      const titleHits = countOccurrences(doc.title, trimmed)
      const tagHits = doc.tags.reduce((acc, tag) => acc + countOccurrences(tag, trimmed), 0)
      const bodyHits = countOccurrences(doc.body, trimmed)
      return {
        doc,
        weight: titleHits * 3 + tagHits * 2 + bodyHits,
        hitCount: titleHits + tagHits + bodyHits,
      }
    })
    .filter((item) => item.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.doc.title.localeCompare(b.doc.title, 'zh-Hans-CN'))

  const hits: KnowledgeHit[] = scored.slice(0, limit).map(({ doc, hitCount }) => ({
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    categoryLabel: doc.categoryLabel,
    snippet: snippetAround(doc.body, trimmed),
    hitCount,
  }))

  return { query: trimmed, total: scored.length, hits }
}
