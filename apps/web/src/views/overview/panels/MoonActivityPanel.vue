<script setup lang="ts">
import { computed } from 'vue'
import type { MoonInfo, Solunar } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { number, percent } from '@/utils/format'

const props = defineProps<{
  moon: MoonInfo | null
  solunar: Solunar | null
  /** 来自钓鱼指数的推荐时段，与 solunar 的理论时段并列展示以便对照 */
  bestHours: string[]
}>()

const items = computed<KeyValueItem[]>(() => {
  const moon = props.moon
  const solunar = props.solunar
  if (!moon || !solunar) return []

  return [
    {
      label: '月相',
      value: `${moon.phaseNameZh} · 照度 ${percent(moon.illuminatedFraction)}`,
    },
    { label: '月龄', value: `${number(moon.age, 1)} 天（朔望月 29.53 天）` },
    { label: '当日强度', value: `${solunar.score.toFixed(1)} · ${solunar.dayRatingZh}` },
    {
      label: '主要时段',
      value: props.bestHours.length > 0 ? props.bestHours.join('、') : '无',
    },
  ]
})
</script>

<template>
  <PanelCard title="月相与日月活跃度" subtitle="solunar 属经验假说，非确定性结论">
    <KeyValueList v-if="items.length > 0" :items="items" />
  </PanelCard>
</template>
