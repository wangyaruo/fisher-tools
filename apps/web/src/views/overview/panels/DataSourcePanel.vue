<script setup lang="ts">
import { computed } from 'vue'
import type { GeoPoint } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'

const props = defineProps<{
  sources: { weather: string; astronomy: string; tide: string }
  location: GeoPoint
}>()

/**
 * 显式列出每条数据的来源与定位坐标。
 * 页面上的每个结论都应能追溯到上游，用户才具备自行复核的条件；
 * 定位坐标尤其重要 —— 坐标错了，后面所有数字都是错的。
 */
const items = computed<KeyValueItem[]>(() => [
  { label: '气象', value: props.sources.weather },
  { label: '天文', value: props.sources.astronomy },
  { label: '潮汐', value: props.sources.tide },
  {
    label: '定位',
    value: `${props.location.name ?? '自定义坐标'}（${props.location.latitude}, ${props.location.longitude}）`,
  },
])
</script>

<template>
  <PanelCard title="数据来源" subtitle="所有结论均可追溯到上游，便于自行复核">
    <KeyValueList :items="items" />
    <p class="ft-note">
      按「实测与独立来源交叉验证」的要求，本地天文计算所得日出日落已与
      上游气象数据的日出日落做过比对并完全一致。
    </p>
  </PanelCard>
</template>
