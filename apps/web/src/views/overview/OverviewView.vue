<script setup lang="ts">
import { computed } from 'vue'
import AsyncSection from '@/components/base/AsyncSection.vue'
import ConditionGrid from '@/components/ConditionGrid.vue'
import FishingIndexCard from '@/components/FishingIndexCard.vue'
import { useOverviewStore } from '@/stores/overview'
import DataSourcePanel from './panels/DataSourcePanel.vue'
import DiurnalSummaryPanel from './panels/DiurnalSummaryPanel.vue'
import MoonActivityPanel from './panels/MoonActivityPanel.vue'
import PressureTrendPanel from './panels/PressureTrendPanel.vue'
import SunTimesPanel from './panels/SunTimesPanel.vue'
import TideWindowPanel from './panels/TideWindowPanel.vue'

/**
 * 垂钓总览页，只负责数据装配与编排。
 *
 * 首屏要回答的是「今天能不能去、几点去」，因此顺序固定为
 * 指数 → 气压 → 日月与潮汐 → 温差 → 来源。
 * 每块内容的具体呈现由对应面板自己决定，本文件只从这里传数据下去。
 */
const overview = useOverviewStore()
const data = computed(() => overview.data)

/** 总览只画未来 48 小时；完整 72 小时曲线在气象曲线页 */
const recentHours = computed(() => data.value?.hourlyWindow.weather.slice(0, 48) ?? [])

/**
 * 定位当前时刻所属的那一天。
 *
 * 不能按下标取 [1]：上游 past_days 变化或查询时刻落在序列首尾时，
 * 下标会指向错误日期，进而展示别的日子的温差 —— 数字看起来正常，
 * 但对应的不是今天，这类错误不会被任何断言捕获。
 */
const todayRange = computed(() => {
  const date = data.value?.current.weather?.time.slice(0, 10)
  if (!date) return null
  return data.value?.diurnalRanges.find((item) => item.date === date) ?? null
})
</script>

<template>
  <div class="ft-page">
    <AsyncSection
      :loading="overview.loading && !data"
      :error="overview.error"
      :empty="!data"
      empty-text="暂无该钓点的数据"
      :skeleton-rows="10"
    >
      <template v-if="data">
        <FishingIndexCard :index="data.fishingIndex" />

        <div class="ft-grid ft-grid--2">
          <ConditionGrid
            :weather="data.current.weather"
            :marine="data.current.marine"
            :trend="data.pressureTrend"
          />
          <PressureTrendPanel :points="recentHours" :trend="data.pressureTrend" />
        </div>

        <div class="ft-grid ft-grid--3">
          <SunTimesPanel :sun="data.astronomy.sun" :moon="data.astronomy.moon" />
          <MoonActivityPanel
            :moon="data.astronomy.moon"
            :solunar="data.astronomy.solunar"
            :best-hours="data.fishingIndex.bestHours"
          />
          <TideWindowPanel :tide="data.tide" />
        </div>

        <div class="ft-grid ft-grid--2">
          <DiurnalSummaryPanel :today="todayRange" />
          <DataSourcePanel :sources="data.sources" :location="data.location" />
        </div>
      </template>
    </AsyncSection>
  </div>
</template>
