<script setup lang="ts">
import { computed } from 'vue'
import type { SolunarPeriod, SunTimes, TidePrediction } from '@fisher-tools/shared/schemas'
import EChart from '@/components/base/EChart.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { CHART_COLORS } from '@/lib/echarts'
import { buildTimelineOption, type TimelineRow } from '@/utils/charts'
import { minutesOfDay } from '@/utils/format'
import { TIDE_KIND_LABELS } from '@/utils/tide'

const props = defineProps<{
  /** 钓鱼指数给出的推荐出钓时段，形如 "10:32-12:32" */
  bestHours: string[]
  /** solunar 日月时段；属经验假说，展示时不得包装成确定性结论 */
  periods: SolunarPeriod[]
  sun: SunTimes | null
  tide: TidePrediction | null
  /** 当前所在整点折算成的当日分钟数，用于在轴上画参考线 */
  nowMinutes: number | null
}>()

const MINUTES_PER_DAY = 1440

/**
 * 24 小时时段轴的行。
 *
 * 顺序即优先级：推荐窗口在最上，依次是日月时段、黄金时段、晨昏、潮汐窗口。
 * 四类窗口分散成四张表时，用户必须在脑子里做时间对齐；叠在同一条轴上
 * 才能直接回答「几点出门」。
 */
const rows = computed<TimelineRow[]>(() => {
  const result: TimelineRow[] = []

  for (const [position, slot] of props.bestHours.entries()) {
    const [from, to] = slot.split('-')
    const start = minutesOfDay(from ?? null)
    const end = minutesOfDay(to ?? null)
    if (start === null || end === null) continue
    result.push({
      label: `推荐窗口 ${position + 1}`,
      startMinutes: start,
      endMinutes: end,
      color: CHART_COLORS.best,
    })
  }

  for (const period of props.periods) {
    const start = minutesOfDay(period.start)
    const end = minutesOfDay(period.end)
    if (start === null || end === null) continue
    result.push({
      label: `${period.type === 'major' ? '主要' : '次要'}·${period.basisLabel}`,
      startMinutes: start,
      endMinutes: end,
      color: CHART_COLORS.solunar,
    })
  }

  const sunTimes = props.sun
  if (sunTimes) {
    const sunRows: Array<[string, string, string]> = [
      ['黄金时段·晨', sunTimes.goldenHourMorningStart, sunTimes.goldenHourMorningEnd],
      ['黄金时段·昏', sunTimes.goldenHourEveningStart, sunTimes.goldenHourEveningEnd],
      ['民用晨昏·晨', sunTimes.civilDawn, sunTimes.sunrise],
      ['民用晨昏·昏', sunTimes.sunset, sunTimes.civilDusk],
    ]
    for (const [label, from, to] of sunRows) {
      const start = minutesOfDay(from)
      const end = minutesOfDay(to)
      if (start === null || end === null) continue
      result.push({ label, startMinutes: start, endMinutes: end, color: CHART_COLORS.sun })
    }
  }

  const tideData = props.tide
  const date = tideData?.date
  if (tideData && date) {
    for (const window of tideData.windows) {
      const startDay = window.start.slice(0, 10)
      const endDay = window.end.slice(0, 10)
      // 潮汐窗口跨日，只画与当天有交集的部分，并按当天裁切；
      // 否则数天的窗口会被压进单日轴，横向位置全部失真
      if (date < startDay || date > endDay) continue
      const start = startDay === date ? minutesOfDay(window.start) : 0
      const end = endDay === date ? minutesOfDay(window.end) : MINUTES_PER_DAY
      if (start === null || end === null) continue
      result.push({
        label: `潮汐·${TIDE_KIND_LABELS[window.kind]}`,
        startMinutes: start,
        endMinutes: end,
        color: CHART_COLORS.tide,
      })
    }
  }

  return result
})

const option = computed(() =>
  buildTimelineOption(rows.value, { nowMinutes: props.nowMinutes }),
)

/** 行高固定、图表高度随行数增长，避免行数多时被压扁 */
const height = computed(() => `${Math.max(220, rows.value.length * 32 + 62)}px`)
</script>

<template>
  <PanelCard
    title="24 小时时段轴"
    subtitle="横轴为钓点当地时间 · 虚线为当前所在整点 · 把四类窗口叠在一起，是为了直接回答「几点出门」"
  >
    <EChart v-if="rows.length > 0" :option="option" :height="height" />
    <el-empty v-else description="当日无可用时段数据" :image-size="72" />
  </PanelCard>
</template>
