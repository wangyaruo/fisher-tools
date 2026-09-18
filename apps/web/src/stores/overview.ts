import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ApiError, api } from '@/api/client'
import type { OverviewResponse } from '@/api/types'
import { useLocationStore } from './location'

/**
 * 总览数据。
 *
 * 做成 store 而不是每个视图各写一份 composable：
 * 总览、气象曲线、日月与潮汐三个页面消费的是同一份 /api/overview 响应，
 * 若各自请求，切页时会重复往返；放在 store 里则一次加载、多页复用。
 */
export const useOverviewStore = defineStore('overview', () => {
  const location = useLocationStore()

  const data = ref<OverviewResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadedAt = ref<number | null>(null)

  /**
   * 数据陈旧阈值。总览是「某个时刻」的快照，页面挂在后台过夜后
   * 「此刻」早已改变；回到前台且数据超过该阈值时自动重取。
   */
  const STALE_MS = 10 * 60 * 1000

  let controller: AbortController | null = null

  async function load(): Promise<void> {
    // 取消上一次未完成的请求，避免快速切换钓点时旧响应覆盖新响应
    controller?.abort()
    controller = new AbortController()

    loading.value = true
    error.value = null
    try {
      data.value = await api.overview(
        location.point,
        location.at.length > 0 ? location.at : undefined,
        controller.signal,
      )
      loadedAt.value = Date.now()
    } catch (caught) {
      if ((caught as Error).name === 'AbortError') return
      error.value =
        caught instanceof ApiError ? caught.message : '加载失败，请稍后重试'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [location.locationKey, location.at] as const,
    () => void load(),
    { immediate: true },
  )

  // store 是应用级单例，监听随应用同寿，无需额外卸载
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      loadedAt.value !== null &&
      Date.now() - loadedAt.value > STALE_MS
    ) {
      void load()
    }
  })

  return { data, loading, error, loadedAt, reload: load }
})
