<script setup lang="ts">
import { computed } from 'vue'
import type { DiurnalRangePoint } from '@fisher-tools/shared/schemas'
import EChart from '@/components/base/EChart.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { buildDiurnalRangeOption } from '@/utils/charts'

const props = defineProps<{
  points: DiurnalRangePoint[]
}>()

const option = computed(() => buildDiurnalRangeOption(props.points))

const subtitle = computed(
  () =>
    `柱为日最高与日最低之差，线为白昼均值与夜间均值之差（近 ${props.points.length} 日）`,
)
</script>

<template>
  <PanelCard title="昼夜温差曲线" :subtitle="subtitle">
    <EChart :option="option" height="300px" />
  </PanelCard>
</template>
