<script setup lang="ts">
import { computed } from 'vue'
import type { SunTimes } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { duration, hhmm } from '@/utils/format'

const props = defineProps<{
  sun: SunTimes | null
}>()

const items = computed<KeyValueItem[]>(() => {
  const sun = props.sun
  if (!sun) return []

  return [
    { label: '日出 / 日落', value: `${hhmm(sun.sunrise)} / ${hhmm(sun.sunset)}` },
    { label: '太阳正午', value: hhmm(sun.solarNoon) },
    { label: '昼长', value: duration(sun.dayLengthMinutes) },
    {
      label: '民用晨昏',
      value: `${hhmm(sun.civilDawn)} – ${hhmm(sun.sunrise)} / ${hhmm(sun.sunset)} – ${hhmm(sun.civilDusk)}`,
    },
    {
      label: '航海晨昏',
      value: `${hhmm(sun.nauticalDawn)} – ${hhmm(sun.civilDawn)} / ${hhmm(sun.civilDusk)} – ${hhmm(sun.nauticalDusk)}`,
    },
    {
      label: '黄金时段',
      value: `${hhmm(sun.goldenHourMorningStart)}–${hhmm(sun.goldenHourMorningEnd)} / ${hhmm(sun.goldenHourEveningStart)}–${hhmm(sun.goldenHourEveningEnd)}`,
    },
  ]
})
</script>

<template>
  <PanelCard title="太阳时刻" subtitle="按钓点经纬度实算，不套用固定早晚六点">
    <KeyValueList v-if="items.length > 0" :items="items" />
    <!-- 给出判据而不只给时间窗口：用户需要知道黄金时段为何是这几段 -->
    <p class="ft-note">
      黄金时段取太阳高度 −4° 至 6° 的区间：此时光线入射角低、水体反差强，
      掠食性鱼种的视觉优势最明显。
    </p>
  </PanelCard>
</template>
