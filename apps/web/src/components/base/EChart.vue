<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { EChartsType } from 'echarts/core'
import { echarts, type ChartOption } from '@/lib/echarts'

const props = withDefaults(defineProps<{ option: ChartOption; height?: string }>(), {
  height: '260px',
})

const container = ref<HTMLDivElement | null>(null)
const instance = shallowRef<EChartsType | null>(null)
let observer: ResizeObserver | null = null

/**
 * 全站图表统一开启无障碍：aria 生成图表的文字描述供屏幕阅读器朗读，
 * decal 给序列叠加纹理，色弱用户也能区分多条曲线。
 * 在这里集中注入，各图表的 build*Option 无需关心。
 */
function withAria(option: ChartOption): ChartOption {
  return {
    ...option,
    aria: { enabled: true, decal: { show: true }, ...(option.aria ?? {}) },
  }
}

onMounted(() => {
  if (!container.value) return
  instance.value = echarts.init(container.value)
  instance.value.setOption(withAria(props.option))
  // 用 ResizeObserver 而非 window.resize：卡片在栅格中变宽时
  // 窗口尺寸可能完全没变，只监听 window 会漏掉这类布局变化
  observer = new ResizeObserver(() => instance.value?.resize())
  observer.observe(container.value)
})

watch(
  () => props.option,
  (option) => {
    // notMerge=true：切换钓点后序列数量可能变化，
    // 合并旧 option 会残留上一次的数据序列
    instance.value?.setOption(withAria(option), true)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  instance.value?.dispose()
  instance.value = null
})
</script>

<template>
  <div ref="container" :style="{ height, width: '100%' }"></div>
</template>
