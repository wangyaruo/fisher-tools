<script setup lang="ts">
import { computed } from 'vue'
import type { MoonInfo } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import { hhmm } from '@/utils/format'

const props = defineProps<{
  moon: MoonInfo | null
}>()

const items = computed<KeyValueItem[]>(() => {
  const moon = props.moon
  if (!moon) return []

  return [
    { label: '月出 / 月落', value: `${hhmm(moon.moonrise)} / ${hhmm(moon.moonset)}` },
    { label: '月中天', value: hhmm(moon.transit) },
    { label: '月下中天', value: hhmm(moon.underfoot) },
  ]
})
</script>

<template>
  <PanelCard title="月亮时刻" subtitle="主要时段以中天为基准，次要时段以月出月落为基准">
    <KeyValueList v-if="items.length > 0" :items="items" />
    <!-- 空字段的成因必须说明，否则用户会以为是数据缺失或程序出错 -->
    <p class="ft-note">
      高纬度或极昼极夜期间，月出月落当日可能不发生，此时对应字段为空，
      时段表中也不会出现该行。
    </p>
  </PanelCard>
</template>
