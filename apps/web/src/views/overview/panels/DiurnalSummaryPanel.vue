<script setup lang="ts">
import { computed } from 'vue'
import type { DiurnalRangePoint } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { number } from '@/utils/format'

const props = defineProps<{
  /** 当日温差；按日期匹配而非按序列下标取，见 OverviewView 的说明 */
  today: DiurnalRangePoint | null
}>()

const subtitle = computed(
  () =>
    `当日温差 ${props.today ? number(props.today.range) : '—'} °C · 温差越小水温越稳定，鱼类开口通常越稳`,
)

const items = computed<KeyValueItem[]>(() => {
  const today = props.today
  if (!today) return []

  return [
    { label: '最高 / 最低', value: `${number(today.max)} / ${number(today.min)} °C` },
    { label: '白昼均值', value: `${number(today.dayMean)} °C` },
    { label: '夜间均值', value: `${number(today.nightMean)} °C` },
    { label: '昼夜均差', value: `${number(today.dayNightDelta)} °C` },
  ]
})
</script>

<template>
  <PanelCard title="昼夜温差（近 7 日）" :subtitle="subtitle">
    <KeyValueList v-if="items.length > 0" :items="items" inline />
    <RouterLink class="ft-more" to="/weather">查看完整气象曲线 →</RouterLink>
  </PanelCard>
</template>
