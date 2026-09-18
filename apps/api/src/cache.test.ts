import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TtlCache } from './cache.js'

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-18T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('写入后可读出，未存在的键返回 null', () => {
    const cache = new TtlCache()
    cache.set('a', 1, 60_000)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('missing')).toBeNull()
    expect(cache.stats().entries).toBe(1)
  })

  it('wrap 第二次命中缓存，不再执行 factory，命中与未命中各计一次', async () => {
    const cache = new TtlCache()
    let calls = 0
    const factory = async () => {
      calls += 1
      return 1
    }

    await cache.wrap('a', 60_000, factory)
    await cache.wrap('a', 60_000, factory)

    expect(calls).toBe(1)
    const stats = cache.stats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
  })

  it('过期条目视为未命中，并被立即移除', () => {
    const cache = new TtlCache()
    cache.set('a', 1, 1_000)

    vi.setSystemTime(new Date('2026-09-18T08:00:02Z'))

    expect(cache.get('a')).toBeNull()
    expect(cache.stats().entries).toBe(0)
  })

  it('wrap 对同键并发去重：factory 只执行一次', async () => {
    const cache = new TtlCache()
    let calls = 0
    const factory = async () => {
      calls += 1
      return 'value'
    }

    const [r1, r2, r3] = await Promise.all([
      cache.wrap('k', 60_000, factory),
      cache.wrap('k', 60_000, factory),
      cache.wrap('k', 60_000, factory),
    ])

    expect(r1).toBe('value')
    expect(r2).toBe('value')
    expect(r3).toBe('value')
    expect(calls).toBe(1)
    expect(cache.stats().inflightDeduped).toBe(2)
  })

  it('wrap 失败后不缓存异常，下一次会重新执行 factory', async () => {
    const cache = new TtlCache()
    let calls = 0

    await expect(
      cache.wrap('k', 60_000, async () => {
        calls += 1
        throw new Error('upstream down')
      }),
    ).rejects.toThrow('upstream down')

    const value = await cache.wrap('k', 60_000, async () => {
      calls += 1
      return 'recovered'
    })

    expect(value).toBe('recovered')
    expect(calls).toBe(2)
  })

  it('超过容量上限时先清理过期条目', () => {
    const cache = new TtlCache(2)
    cache.set('expired', 'x', 1_000)
    cache.set('alive', 'y', 60_000)

    vi.setSystemTime(new Date('2026-09-18T08:00:02Z'))
    // expired 已过期，写入第三个键时应清掉它而不是淘汰 alive
    cache.set('new', 'z', 60_000)

    expect(cache.get('alive')).toBe('y')
    expect(cache.get('new')).toBe('z')
    expect(cache.stats().entries).toBe(2)
  })

  it('无过期条目可清时，按插入序淘汰最早写入的条目', () => {
    const cache = new TtlCache(2)
    cache.set('a', 1, 60_000)
    cache.set('b', 2, 60_000)
    cache.set('c', 3, 60_000)

    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
    expect(cache.stats().entries).toBe(2)
  })
})
