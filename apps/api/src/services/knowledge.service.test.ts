import { describe, expect, it } from 'vitest'
import {
  getKnowledgeDoc,
  listKnowledge,
  loadKnowledgeDocs,
  searchKnowledge,
} from './knowledge.service.js'

/**
 * 直接对仓库内置的真实 Markdown 跑解析：一个坏 frontmatter 会让知识库
 * 整页 500，而类型检查测不出这类失败，因此解析正确性必须有测试覆盖。
 */
describe('知识库内容（真实 Markdown 文件）', () => {
  it('48 篇文档全部通过 frontmatter 校验，字段完整', async () => {
    const docs = await loadKnowledgeDocs()

    expect(docs).toHaveLength(48)
    for (const doc of docs) {
      expect(doc.slug.length).toBeGreaterThan(0)
      expect(doc.title.length).toBeGreaterThan(0)
      expect(doc.summary.length).toBeGreaterThan(0)
      expect(doc.categoryLabel.length).toBeGreaterThan(0)
      expect(doc.body.length).toBeGreaterThan(0)
      expect(doc.wordCount).toBeGreaterThan(0)
    }
  })

  it('slug 全局唯一', async () => {
    const docs = await loadKnowledgeDocs()
    const slugs = docs.map((doc) => doc.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('按分类过滤，过滤结果一定少于全量', async () => {
    const all = await listKnowledge()
    const regulation = await listKnowledge('regulation')

    expect(regulation.length).toBeGreaterThan(0)
    expect(regulation.length).toBeLessThan(all.length)
    expect(regulation.every((doc) => doc.category === 'regulation')).toBe(true)
  })

  it('列表项不携带正文', async () => {
    const items = await listKnowledge()
    for (const item of items) {
      expect('body' in item).toBe(false)
    }
  })

  it('检索：标题命中的文档排在最前', async () => {
    const result = await searchKnowledge('鲫鱼')

    expect(result.total).toBeGreaterThan(0)
    expect(result.hits[0]!.slug).toBe('species-crucian-carp')
    expect(result.hits[0]!.title).toContain('鲫鱼')
    expect(result.hits[0]!.snippet.length).toBeGreaterThan(0)
  })

  it('空检索词返回零结果', async () => {
    const result = await searchKnowledge('   ')
    expect(result.total).toBe(0)
    expect(result.hits).toHaveLength(0)
  })

  it('未知 slug 返回 null 而不是抛错', async () => {
    expect(await getKnowledgeDoc('no-such-doc')).toBeNull()
  })
})
