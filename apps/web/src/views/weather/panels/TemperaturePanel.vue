<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyWeatherPoint } from '@fisher-tools/shared/schemas'
import EChart from '@/components/base/EChart.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { buildTemperatureOption } from '@/utils/charts'

const props = defineProps<{
  points: HourlyWeatherPoint[]
}>()

const option = computed(() => buildTemperatureOption(props.points))
</script>

<template>
  <PanelCard title="气温与体感温度" subtitle="底色区间为夜间（依据上游昼夜标记）">
    <EChart :option="option" height="300px" />
  </PanelCard>
</template>
