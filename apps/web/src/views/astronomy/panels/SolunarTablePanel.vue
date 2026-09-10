<script setup lang="ts">
import type { Solunar } from '@fisher-tools/shared/schemas'
import PanelCard from '@/components/base/PanelCard.vue'
import { hhmm } from '@/utils/format'

defineProps<{
  solunar: Solunar | null
}>()
</script>

<template>
  <PanelCard
    title="日月活跃时段明细"
    subtitle="主要时段前后各 1 小时，次要时段前后各 45 分钟"
  >
    <el-table v-if="solunar && solunar.periods.length > 0" :data="solunar.periods" size="small">
      <el-table-column label="类型" width="92">
        <template #default="{ row }">{{ row.typeLabel }}</template>
      </el-table-column>
      <el-table-column label="依据" width="110">
        <template #default="{ row }">{{ row.basisLabel }}</template>
      </el-table-column>
      <el-table-column label="峰值" width="90">
        <template #default="{ row }">{{ hhmm(row.peak) }}</template>
      </el-table-column>
      <el-table-column label="窗口">
        <template #default="{ row }">{{ hhmm(row.start) }} – {{ hhmm(row.end) }}</template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="当日无日月时段" :image-size="72" />

    <!--
      方法论默认折叠但不删除：solunar 是经验假说而非定论，
      依据必须随结果一起可查，否则用户会把经验规律当成实测结论。
    -->
    <details v-if="solunar" class="ft-caveats">
      <summary>方法论与局限性</summary>
      <p class="ft-note">{{ solunar.method }}</p>
    </details>
  </PanelCard>
</template>

<style scoped>
.ft-caveats {
  margin-top: 12px;
  font-size: 12px;
}

.ft-caveats summary {
  cursor: pointer;
  color: var(--ft-text-muted);
}
</style>
