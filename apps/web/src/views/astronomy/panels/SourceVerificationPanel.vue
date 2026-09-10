<script setup lang="ts">
import { computed } from 'vue'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'

const props = defineProps<{
  sources: { weather: string; astronomy: string; tide: string }
}>()

const items = computed<KeyValueItem[]>(() => [
  { label: '天文计算', value: props.sources.astronomy },
  { label: '潮汐', value: props.sources.tide },
  { label: '气压与气温', value: props.sources.weather },
])
</script>

<template>
  <PanelCard title="数据来源与验证" subtitle="所有结论均可追溯到上游，便于自行复核">
    <KeyValueList :items="items" />
    <p class="ft-note">
      交叉验证：本页日出日落由本地 astronomy-engine 实算，已与上游气象数据的
      日出日落字段逐日比对并完全一致。潮汐部分不含站点潮高与具体潮时，
      海钓请以当地海洋预报机构的潮汐表为准。
    </p>
  </PanelCard>
</template>
