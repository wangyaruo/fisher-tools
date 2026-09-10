<script setup lang="ts">
import { computed } from 'vue'
import AsyncSection from '@/components/base/AsyncSection.vue'
import { useOverviewStore } from '@/stores/overview'
import { minutesOfDay } from '@/utils/format'
import MoonDetailPanel from './panels/MoonDetailPanel.vue'
import MoonPhasePanel from './panels/MoonPhasePanel.vue'
import SolunarTablePanel from './panels/SolunarTablePanel.vue'
import SourceVerificationPanel from './panels/SourceVerificationPanel.vue'
import SunDetailPanel from './panels/SunDetailPanel.vue'
import TideTablePanel from './panels/TideTablePanel.vue'
import TimelinePanel from './panels/TimelinePanel.vue'

/**
 * 日月与潮汐页，只负责数据装配与编排。
 *
 * 顺序按「先给结论、再给依据」组织：月相与当日强度 → 24 小时时段轴
 * → 太阳 / 月亮时刻 → 时段与潮汐明细 → 来源与验证。
 */
const overview = useOverviewStore()
const data = computed(() => overview.data)

/** 上游逐小时数据均为整点，因此「当前时刻」取所在整点 */
const nowMinutes = computed(() => minutesOfDay(data.value?.current.weather?.time ?? null))
</script>

<template>
  <div class="ft-page">
    <AsyncSection
      :loading="overview.loading && !data"
      :error="overview.error"
      :empty="!data"
      empty-text="暂无日月与潮汐数据"
      :skeleton-rows="10"
    >
      <template v-if="data">
        <MoonPhasePanel :moon="data.astronomy.moon" :solunar="data.astronomy.solunar" />

        <TimelinePanel
          :best-hours="data.fishingIndex.bestHours"
          :periods="data.astronomy.solunar.periods"
          :sun="data.astronomy.sun"
          :tide="data.tide"
          :now-minutes="nowMinutes"
        />

        <div class="ft-grid ft-grid--2">
          <SunDetailPanel :sun="data.astronomy.sun" />
          <MoonDetailPanel :moon="data.astronomy.moon" />
        </div>

        <div class="ft-grid ft-grid--2">
          <SolunarTablePanel :solunar="data.astronomy.solunar" />
          <TideTablePanel :tide="data.tide" />
        </div>

        <SourceVerificationPanel :sources="data.sources" />
      </template>
    </AsyncSection>
  </div>
</template>
