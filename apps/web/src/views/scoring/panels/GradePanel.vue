<script setup lang="ts">
import { computed } from 'vue'
import { GRADE_THRESHOLDS } from '@fisher-tools/shared/scoring/guides'
import PanelCard from '@/components/base/PanelCard.vue'

/** 各等级的含义说明 */
const DESCRIPTIONS: Record<string, string> = {
  excellent: '多个核心因子同时有利，属于不常见的好窗口。',
  good: '整体条件偏有利，值得安排出钓。',
  fair: '有利与不利大致相抵，结果更取决于钓位与时段的选择。',
  poor: '多数因子不利，需要靠具体钓位经验弥补。',
  bad: '条件普遍不利，建议改期或只做试钓。',
}

/**
 * 区间由阈值表反推，不手写：
 * 手写区间会在调整阈值后与模型不一致，而页面上的数字最容易被当成权威。
 * 上界取前一档的 min 减 1，最高一档封顶 100。
 */
const rows = computed(() =>
  GRADE_THRESHOLDS.map((item, index) => ({
    ...item,
    upper: index === 0 ? 100 : GRADE_THRESHOLDS[index - 1]!.min - 1,
    description: DESCRIPTIONS[item.grade] ?? '',
  })),
)
</script>

<template>
  <PanelCard title="等级划分" subtitle="总分按下列区间映射为等级，区间由阈值表直接推导">
    <el-table :data="rows" size="small" class="ft-grades">
      <el-table-column label="等级" width="110">
        <template #default="{ row }">
          <span class="ft-grade" :class="`is-${row.grade}`">{{ row.label }}</span>
        </template>
      </el-table-column>

      <el-table-column label="分数区间" width="120">
        <template #default="{ row }">
          <span class="ft-mono">{{ row.min }} – {{ row.upper }}</span>
        </template>
      </el-table-column>

      <el-table-column label="含义">
        <template #default="{ row }">
          <span class="ft-note">{{ row.description }}</span>
        </template>
      </el-table-column>
    </el-table>
  </PanelCard>
</template>

<style scoped>
.ft-grades {
  width: 100%;
}

.ft-grade {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.ft-grade.is-excellent,
.ft-grade.is-good {
  background: var(--ft-accent-soft);
  color: var(--ft-accent-strong);
  border: 1px solid #9fe1cb;
}

.ft-grade.is-fair {
  background: var(--ft-warn-soft);
  color: #6b4a12;
  border: 1px solid #ef9f27;
}

.ft-grade.is-poor,
.ft-grade.is-bad {
  background: var(--ft-danger-soft);
  color: #7a1717;
  border: 1px solid #f09595;
}
</style>
