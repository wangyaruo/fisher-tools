import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  CUSTOM_LOCATION_KEY,
  DEFAULT_LOCATION_KEY,
  PRESET_LOCATIONS,
  sanitizeCustomLocation,
  type CustomLocation,
} from '@/config/locations'
import type { QueryPoint } from '@/api/client'

const STORAGE_KEY = 'fisher-tools.location'

interface PersistedState {
  key: string
  at: string
  custom: CustomLocation | null
}

/** current 的视图类型：预设项与自定义项的并集（note 可选） */
type LocationView = Omit<(typeof PRESET_LOCATIONS)[number], 'note'> & { note?: string }

function readPersisted(): PersistedState {
  const fallback: PersistedState = { key: DEFAULT_LOCATION_KEY, at: '', custom: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PersistedState>

    const custom = sanitizeCustomLocation(parsed.custom ?? null)
    const isPreset = PRESET_LOCATIONS.some((item) => item.key === parsed.key)
    // custom 键只有在自定义数据本身合法时才成立，否则回落默认钓点
    const key = isPreset
      ? parsed.key!
      : parsed.key === CUSTOM_LOCATION_KEY && custom
        ? CUSTOM_LOCATION_KEY
        : DEFAULT_LOCATION_KEY

    return { key, at: typeof parsed.at === 'string' ? parsed.at : '', custom }
  } catch {
    return fallback
  }
}

/**
 * 钓点与时刻状态。
 *
 * 只保存预设钓点的 key、自定义钓点的字段与「查询时刻」，不保存预设坐标快照：
 * 预设列表若调整坐标，旧的快照会让用户看到过时数据。
 */
export const useLocationStore = defineStore('location', () => {
  const persisted = readPersisted()

  const locationKey = ref<string>(persisted.key)
  /**
   * 查询时刻，格式 YYYY-MM-DDTHH:mm，空字符串表示「此刻」。
   * 之所以允许指定时刻：出钓通常提前一天规划，需要看的是
   * 明天清晨的窗口，而不是当前这一秒的条件。
   */
  const at = ref<string>(persisted.at)

  /** 用户自建钓点；null 表示尚未创建 */
  const custom = ref<CustomLocation | null>(persisted.custom)

  const current = computed<LocationView>(() => {
    if (locationKey.value === CUSTOM_LOCATION_KEY && custom.value) {
      return { key: CUSTOM_LOCATION_KEY, ...custom.value }
    }
    return PRESET_LOCATIONS.find((item) => item.key === locationKey.value) ?? PRESET_LOCATIONS[0]!
  })

  const point = computed<QueryPoint>(() => ({
    latitude: current.value.latitude,
    longitude: current.value.longitude,
    timezone: current.value.timezone,
    name: current.value.name,
  }))

  function persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ key: locationKey.value, at: at.value, custom: custom.value }),
      )
    } catch {
      // 隐私模式下 localStorage 可能不可写，静默降级为仅内存状态
    }
  }

  function setLocation(key: string): void {
    if (key === CUSTOM_LOCATION_KEY) {
      if (!custom.value) return
    } else if (!PRESET_LOCATIONS.some((item) => item.key === key)) {
      return
    }
    locationKey.value = key
    persist()
  }

  /** 创建或更新自定义钓点，并立即切换过去 */
  function setCustom(point: CustomLocation): void {
    custom.value = point
    locationKey.value = CUSTOM_LOCATION_KEY
    persist()
  }

  function setAt(value: string): void {
    at.value = value
    persist()
  }

  function resetAt(): void {
    at.value = ''
    persist()
  }

  return { locationKey, at, current, point, custom, setLocation, setCustom, setAt, resetAt }
})
