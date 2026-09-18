import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.js'

/**
 * HTTP 层集成测试，用 fastify.inject 在进程内完成，不起端口、不依赖外部网络。
 * 天文与潮汐为本地计算，可安全走通 200 路径；
 * 气象类接口只测参数校验（400 在上游请求之前抛出，不会触网）。
 */
describe('HTTP 层', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health 返回 ok 与缓存统计', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.cache).toMatchObject({ entries: expect.any(Number), hits: expect.any(Number) })
  })

  it('GET /api/astronomy 本地计算返回月、日与 solunar', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/astronomy?latitude=22.54&longitude=114.06&timezone=Asia/Shanghai&date=2026-09-18',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.date).toBe('2026-09-18')
    expect(body.moon.phase).toBeGreaterThanOrEqual(0)
    expect(body.moon.phase).toBeLessThanOrEqual(1)
    expect(typeof body.sun.sunrise).toBe('string')
    expect(Array.isArray(body.solunar.periods)).toBe(true)
  })

  it('缺少坐标时返回 400 而不是 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/forecast' })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('BadRequest')
  })

  it('时刻格式不合法返回 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/fishing-index?latitude=22.54&longitude=114.06&at=2026-09-18%2008:00',
    })

    expect(res.statusCode).toBe(400)
  })

  describe('知识库', () => {
    it('分类清单带缓存头与 ETag', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/knowledge/categories' })

      expect(res.statusCode).toBe(200)
      expect(res.headers['cache-control']).toBe('public, max-age=300')
      expect(res.headers.etag).toMatch(/^W\/".+"$/)
      expect(res.json().length).toBe(7)
    })

    it('ETag 命中时返回 304', async () => {
      const first = await app.inject({ method: 'GET', url: '/api/knowledge' })
      const etag = first.headers.etag as string
      expect(etag).toBeTruthy()

      const second = await app.inject({
        method: 'GET',
        url: '/api/knowledge',
        headers: { 'if-none-match': etag },
      })
      expect(second.statusCode).toBe(304)
      expect(second.body).toBe('')
    })

    it('列表返回 42 篇，支持分类过滤', async () => {
      const all = await app.inject({ method: 'GET', url: '/api/knowledge' })
      expect(all.json().total).toBe(42)

      const filtered = await app.inject({
        method: 'GET',
        url: '/api/knowledge?category=safety',
      })
      const body = filtered.json()
      expect(body.total).toBeGreaterThan(0)
      expect(body.total).toBeLessThan(42)
      expect(body.items.every((item: { category: string }) => item.category === 'safety')).toBe(
        true,
      )
    })

    it('非法分类值返回 400', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/knowledge?category=nope' })
      expect(res.statusCode).toBe(400)
    })

    it('检索缺少 q 返回 400，正常检索不携带缓存头', async () => {
      const missing = await app.inject({ method: 'GET', url: '/api/knowledge/search' })
      expect(missing.statusCode).toBe(400)

      const res = await app.inject({
        method: 'GET',
        url: `/api/knowledge/search?q=${encodeURIComponent('鲫鱼')}`,
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().total).toBeGreaterThan(0)
      expect(res.headers['cache-control']).toBeUndefined()
      expect(res.headers.etag).toBeUndefined()
    })

    it('未知 slug 返回 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/knowledge/no-such-doc' })
      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('NotFound')
    })

    it('大响应在客户端支持时走 gzip', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/knowledge',
        headers: { 'accept-encoding': 'gzip' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-encoding']).toBe('gzip')
    })
  })
})
