interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface CacheStats {
  entries: number
  hits: number
  misses: number
  inflightDeduped: number
}

/**
 * 带 TTL 的内存缓存，并支持同键并发去重。
 *
 * 为什么需要去重：一次总览请求要同时打气象、海洋与天文三路上游，
 * 多个用户或多次刷新会在同一秒内产生完全相同的上游请求。
 * 若不去重，上游很可能返回 429，而这是最容易避免的一类故障。
 */
export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>()
  private readonly inflight = new Map<string, Promise<unknown>>()
  private hits = 0
  private misses = 0
  private inflightDeduped = 0

  /**
   * @param maxEntries 容量上限。key 由坐标与时刻组合而成，长期运行若不设上限，
   *   内存会随不同钓点 × 时刻的组合单调增长；pruneExpired 只在 stats() 时触发，
   *   不足以约束写入路径。默认 500 条对单进程自用足够宽裕。
   */
  constructor(private readonly maxEntries = 500) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      this.pruneExpired()
      // 清理过期后仍满：按插入序淘汰最早写入的条目（Map 迭代序即插入序）
      for (const oldest of this.store.keys()) {
        if (this.store.size < this.maxEntries) break
        this.store.delete(oldest)
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  /**
   * 读缓存，未命中则执行 factory 并写回。
   * 同一 key 的并发调用会共享同一个 Promise，只有第一次真正发起上游请求。
   */
  async wrap<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      this.hits += 1
      return cached
    }

    const pending = this.inflight.get(key)
    if (pending) {
      this.inflightDeduped += 1
      this.misses += 1
      return pending as Promise<T>
    }

    this.misses += 1
    const task = factory()
      .then((value) => {
        this.set(key, value, ttlMs)
        return value
      })
      .finally(() => {
        this.inflight.delete(key)
      })

    this.inflight.set(key, task)
    return task
  }

  stats(): CacheStats {
    this.pruneExpired()
    return {
      entries: this.store.size,
      hits: this.hits,
      misses: this.misses,
      inflightDeduped: this.inflightDeduped,
    }
  }

  clear(): void {
    this.store.clear()
  }

  private pruneExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key)
    }
  }
}

export const cache = new TtlCache()
