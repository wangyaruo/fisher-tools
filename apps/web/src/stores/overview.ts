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

  return { data, loading, error, loadedAt, reload: load }
})
