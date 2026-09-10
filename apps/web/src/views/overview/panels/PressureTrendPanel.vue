<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyWeatherPoint, PressureTrend } from '@fisher-tools/shared/schemas'
import EChart from '@/components/base/EChart.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { buildPressureOption } from '@/utils/charts'

const props = defineProps<{
  /** 总览只取未来 48 小时，完整 72 小时曲线在气象曲线页 */
  points: HourlyWeatherPoint[]
  trend: PressureTrend | null
}>()

/** 基准线取窗口首点，否则曲线看不出「在涨还是在落」 */
const option = computed(() =>
  buildPressureOption(props.points, {
    baseline: props.points[0]?.surfacePressure ?? null,
  }),
)
</script>

<template>
  <PanelCard title="站点气压趋势" subtitle="未来 48 小时 · 虚线为起始基准">
    <EChart :option="option" height="252px" />
    <p v-if="trend" class="ft-note">{{ trend.interpretation }}</p>
  </PanelCard>
</template>
