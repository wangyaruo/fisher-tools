import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { CUSTOM_LOCATION_KEY, sanitizeCustomLocation } from '@/config/locations'
import { useLocationStore } from './location'

/**
 * node 环境没有 localStorage，用一个内存桩替代。
 * store 在首次 useLocationStore() 时才读取持久化数据，
 * 因此每个用例先装桩、再激活新的 pinia，即可隔离初始状态。
 */
function installLocalStorageStub(initial: Record<string, string> = {}): Map<string, string> {
  const data = new Map<string, string>(Object.entries(initial))
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  }
  return data
}

const STORAGE_KEY = 'fisher-tools.location'

beforeEach(() => {
  installLocalStorageStub()
  setActivePinia(createPinia())
})

describe('sanitizeCustomLocation', () => {
  it('合法输入通过并规整（名称去空白）', () => {
    expect(
      sanitizeCustomLocation({
        name: '  西丽水库  ',
        latitude: '22.58',
        longitude: 113.95,
        timezone: 'Asia/Shanghai',
        water: '淡水',
      }),
    ).toEqual({
      name: '西丽水库',
      latitude: 22.58,
      longitude: 113.95,
      timezone: 'Asia/Shanghai',
      water: '淡水',
    })
  })

  it('逐项拒绝非法输入', () => {
    const base = {
      name: '钓点',
      latitude: 22.5,
      longitude: 114,
      timezone: 'Asia/Shanghai',
      water: '淡水',
    }
    expect(sanitizeCustomLocation(null)).toBeNull()
    expect(sanitizeCustomLocation('字符串')).toBeNull()
    expect(sanitizeCustomLocation({ ...base, name: '' })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, name: '超'.repeat(21) })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, latitude: 91 })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, latitude: '不是数字' })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, longitude: -181 })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, timezone: '' })).toBeNull()
    expect(sanitizeCustomLocation({ ...base, water: '海水' })).toBeNull()
  })
})

describe('location store 的自定义钓点', () => {
  const point = {
    name: '西丽水库',
    latitude: 22.58,
    longitude: 113.95,
    timezone: 'Asia/Shanghai',
    water: '淡水' as const,
  }

  it('默认选中深圳预设点', () => {
    const store = useLocationStore()
    expect(store.locationKey).toBe('shenzhen')
    expect(store.current.name).toBe('深圳')
    expect(store.custom).toBeNull()
  })

  it('setCustom 立即切换并把字段写入持久化', () => {
    const data = installLocalStorageStub()
    const store = useLocationStore()

    store.setCustom(point)

    expect(store.locationKey).toBe(CUSTOM_LOCATION_KEY)
    expect(store.current.name).toBe('西丽水库')
    expect(store.point.latitude).toBe(22.58)

    const persisted = JSON.parse(data.get(STORAGE_KEY)!)
    expect(persisted.key).toBe(CUSTOM_LOCATION_KEY)
    expect(persisted.custom.name).toBe('西丽水库')
  })

  it('持久化含合法自定义点时，新会话直接恢复到自定义点', () => {
    installLocalStorageStub({
      [STORAGE_KEY]: JSON.stringify({ key: CUSTOM_LOCATION_KEY, at: '', custom: point }),
    })
    const store = useLocationStore()

    expect(store.locationKey).toBe(CUSTOM_LOCATION_KEY)
    expect(store.current.water).toBe('淡水')
  })

  it('持久化的自定义数据损坏时回落默认点', () => {
    installLocalStorageStub({
      [STORAGE_KEY]: JSON.stringify({
        key: CUSTOM_LOCATION_KEY,
        at: '',
        custom: { name: '', latitude: 'abc' },
      }),
    })
    const store = useLocationStore()

    expect(store.locationKey).toBe('shenzhen')
    expect(store.custom).toBeNull()
  })

  it('未创建自定义点时 setLocation("custom") 不生效', () => {
    const store = useLocationStore()
    store.setLocation(CUSTOM_LOCATION_KEY)
    expect(store.locationKey).toBe('shenzhen')
  })

  it('从自定义点可以切回预设点', () => {
    const store = useLocationStore()
    store.setCustom(point)
    store.setLocation('tangxia')
    expect(store.locationKey).toBe('tangxia')
    expect(store.current.name).toBe('东莞塘厦')
  })
})
