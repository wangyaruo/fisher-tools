<script setup lang="ts">
import { computed } from 'vue'
import type { TidePrediction } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { mmdd, percent } from '@/utils/format'
import { TIDE_KIND_LABELS } from '@/utils/tide'

const props = defineProps<{
  tide: TidePrediction
}>()

/**
 * 当前所处的潮汐窗口。
 * 窗口是跨日区间（如 09-08 至 09-13），因此判据是「查询日期落在区间内」，
 * 不能拿窗口起止与查询时刻做相等比较。
 */
const currentWindow = computed(
  () =>
    props.tide.windows.find(
      (item) =>
        item.start.slice(0, 10) <= props.tide.date && props.tide.date <= item.end.slice(0, 10),
    ) ?? null,
)

const items = computed<KeyValueItem[]>(() => {
  const rows: KeyValueItem[] = []

  if (currentWindow.value) {
    rows.push({ label: '当前位于', value: currentWindow.value.label })
  }

  for (const window of props.tide.windows) {
    rows.push({
      label: `${mmdd(window.start)} – ${mmdd(window.end)}`,
      value: `${TIDE_KIND_LABELS[window.kind]} · 照度 ${percent(window.illuminatedFraction)}`,
    })
  }

  return rows
})

const subtitle = computed(() =>
  props.tide.isCoastal ? '天文潮近似 · 不含站点潮高' : '该点位判定为内陆水域',
)
</script>

<template>
  <PanelCard title="潮汐窗口" :subtitle="subtitle">
    <KeyValueList :items="items" />
    <!-- 精度声明原样展示，不包装成确定性结论 -->
    <p class="ft-disclaimer">{{ tide.disclaimer }}</p>
  </PanelCard>
</template>
