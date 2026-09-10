<script setup lang="ts">
import { computed } from 'vue'
import AsyncSection from '@/components/base/AsyncSection.vue'
import { useOverviewStore } from '@/stores/overview'
import DailyTablePanel from './panels/DailyTablePanel.vue'
import DiurnalRangePanel from './panels/DiurnalRangePanel.vue'
import MarinePanel from './panels/MarinePanel.vue'
import PressurePanel from './panels/PressurePanel.vue'
import TemperaturePanel from './panels/TemperaturePanel.vue'

/**
 * 气象曲线页，只负责数据装配与编排。
 *
 * 派生逻辑（各图表的 option、海洋可见行的筛选、数值格式化）由各面板自己持有，
 * 因此本文件里不出现任何 build*Option 调用 —— 图表怎么画属于面板的实现细节，
 * 页面只决定「有哪几块、按什么顺序、喂什么数据」。
 */
const overview = useOverviewStore()
const data = computed(() => overview.data)

/** 完整 72 小时窗口；总览页只画其中前 48 小时 */
const hourlyWindow = computed(() => data.value?.hourlyWindow ?? null)
</script>

<template>
  <div class="ft-page">
    <AsyncSection
      :loading="overview.loading && !data"
      :error="overview.error"
      :empty="!data"
      empty-text="暂无可用的气象数据"
      :skeleton-rows="10"
    >
      <template v-if="data && hourlyWindow">
        <PressurePanel
          :points="hourlyWindow.weather"
          :trend="data.pressureTrend"
          :from="hourlyWindow.from"
        />
        <TemperaturePanel :points="hourlyWindow.weather" />
        <DiurnalRangePanel :points="data.diurnalRanges" />
        <DailyTablePanel :rows="data.daily" />
        <MarinePanel :rows="hourlyWindow.marine" />
      </template>
    </AsyncSection>
  </div>
</template>
