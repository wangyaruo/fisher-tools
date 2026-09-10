<script setup lang="ts">
import { computed } from 'vue'
import type { MoonInfo, SunTimes } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { duration, hhmm } from '@/utils/format'

const props = defineProps<{
  sun: SunTimes | null
  moon: MoonInfo | null
}>()

/**
 * 昼长用 duration() 而非在模板里现算：模板内的 Math.floor / Math.round
 * 既难读，也无法被复用或测试；格式化统一交给 utils/format。
 */
const items = computed<KeyValueItem[]>(() => {
  const sun = props.sun
  if (!sun) return []

  const rows: KeyValueItem[] = [
    { label: '日出 / 日落', value: `${hhmm(sun.sunrise)} / ${hhmm(sun.sunset)}` },
    {
      label: '晨昏窗口',
      value: `${hhmm(sun.civilDawn)} – ${hhmm(sun.sunrise)} / ${hhmm(sun.sunset)} – ${hhmm(sun.civilDusk)}`,
    },
    {
      label: '黄金时段',
      value: `${hhmm(sun.goldenHourMorningStart)}–${hhmm(sun.goldenHourMorningEnd)} / ${hhmm(sun.goldenHourEveningStart)}–${hhmm(sun.goldenHourEveningEnd)}`,
    },
    { label: '昼长', value: duration(sun.dayLengthMinutes) },
  ]

  // 月出月落在极区可能当天不发生，字段为空时整行不展示
  if (props.moon) {
    rows.push({
      label: '月出 / 月落',
      value: `${hhmm(props.moon.moonrise)} / ${hhmm(props.moon.moonset)}`,
    })
  }

  return rows
})
</script>

<template>
  <PanelCard title="日月时刻" subtitle="按钓点经度实算，非固定早晚六点">
    <KeyValueList v-if="items.length > 0" :items="items" />
    <RouterLink class="ft-more" to="/astronomy">查看完整日月与潮汐面板 →</RouterLink>
  </PanelCard>
</template>
