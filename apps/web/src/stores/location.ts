import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_LOCATION_KEY, PRESET_LOCATIONS } from '@/config/locations'
import type { QueryPoint } from '@/api/client'

const STORAGE_KEY = 'fisher-tools.location'

interface PersistedState {
  key: string
  at: string
}

function readPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { key: DEFAULT_LOCATION_KEY, at: '' }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const key = PRESET_LOCATIONS.some((item) => item.key === parsed.key)
      ? parsed.key!
      : DEFAULT_LOCATION_KEY
    return { key, at: typeof parsed.at === 'string' ? parsed.at : '' }
  } catch {
    return { key: DEFAULT_LOCATION_KEY, at: '' }
  }
}

/**
 * 钓点与时刻状态。
 *
 * 只保存预设钓点的 key 与「查询时刻」，不保存坐标快照：
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

  const current = computed(
    () => PRESET_LOCATIONS.find((item) => item.key === locationKey.value) ?? PRESET_LOCATIONS[0]!,
  )

  const point = computed<QueryPoint>(() => ({
    latitude: current.value.latitude,
    longitude: current.value.longitude,
    timezone: current.value.timezone,
    name: current.value.name,
  }))

  function persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ key: locationKey.value, at: at.value }))
    } catch {
      // 隐私模式下 localStorage 可能不可写，静默降级为仅内存状态
    }
  }

  function setLocation(key: string): void {
    if (!PRESET_LOCATIONS.some((item) => item.key === key)) return
    locationKey.value = key
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

  return { locationKey, at, current, point, setLocation, setAt, resetAt }
})
