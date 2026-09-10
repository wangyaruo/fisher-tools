<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyWeatherPoint, PressureTrend } from '@fisher-tools/shared/schemas'
import EChart from '@/components/base/EChart.vue'
import FigureRow from '@/components/base/FigureRow.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { buildPressureOption } from '@/utils/charts'
import { hhmm, signed } from '@/utils/format'

const props = defineProps<{
  points: HourlyWeatherPoint[]
  trend: PressureTrend
  /** 窗口起始时刻，取自接口而非首个数据点 —— 首点可能因上游缺测被丢弃 */
  from: string | null
}>()

/**
 * 基准线取窗口首个数据点。
 * 气压曲线本身只表达相对变化，不标基准就读不出「在涨还是在落」，
 * 而趋势方向正是钓鱼场景里权重最高的判据。
 */
const option = computed(() =>
  buildPressureOption(props.points, {
    baseline: props.points[0]?.surfacePressure ?? null,
  }),
)

const figures = computed(() => [
  { label: '1 小时', value: signed(props.trend.delta1h, 2), unit: 'hPa' },
  { label: '3 小时', value: signed(props.trend.delta3h, 2), unit: 'hPa' },
  { label: '6 小时', value: signed(props.trend.delta6h, 2), unit: 'hPa' },
  { label: '12 小时', value: signed(props.trend.delta12h, 2), unit: 'hPa' },
])

const subtitle = computed(
  () =>
    `窗口 ${hhmm(props.from)} 起共 ${props.points.length} 小时 · 当前判定为「${props.trend.tendencyLabel}」`,
)
</script>

<template>
  <PanelCard title="站点气压曲线" :subtitle="subtitle">
    <EChart :option="option" height="300px" />
    <p class="ft-note">{{ trend.interpretation }}</p>
    <FigureRow :items="figures" />
  </PanelCard>
</template>
