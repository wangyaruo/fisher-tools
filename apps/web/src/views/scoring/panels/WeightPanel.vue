<script setup lang="ts">
import { computed } from 'vue'
import { FACTOR_LABELS, FACTOR_WEIGHTS } from '@fisher-tools/shared/scoring/guides'
import PanelCard from '@/components/base/PanelCard.vue'

/**
 * 权重表按权重降序展示，并用条形长度表示相对大小。
 * 条形宽度以「最大权重」为 100% 而非以和为 100%，
 * 这样最小的几项仍看得见长度差异，不会缩成一条线。
 */
const rows = computed(() => {
  const entries = Object.entries(FACTOR_WEIGHTS) as Array<[keyof typeof FACTOR_WEIGHTS, number]>
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] ?? 1

  return sorted.map(([key, weight]) => ({
    key,
    label: FACTOR_LABELS[key],
    weight,
    percent: Math.round(weight * 1000) / 10,
    ratio: `${Math.round((weight / max) * 100)}%`,
  }))
})

const totalPercent = computed(() =>
  Math.round(rows.value.reduce((sum, r) => sum + r.percent, 0) * 10) / 10,
)
</script>

<template>
  <PanelCard
    title="因子权重"
    subtitle="回答「同样的偏差能撬动多少分」；权重之和恒为 1"
  >
    <ul class="ft-weights">
      <li v-for="row in rows" :key="row.key" class="ft-weight">
        <span class="ft-weight__label">{{ row.label }}</span>

        <span class="ft-weight__bar" aria-hidden="true">
          <span class="ft-weight__fill" :style="{ width: row.ratio }"></span>
        </span>

        <span class="ft-weight__value ft-mono">{{ row.percent.toFixed(1) }}%</span>
      </li>
    </ul>

    <p class="ft-note ft-weights__foot">
      合计 {{ totalPercent.toFixed(1) }}%。权重由人为给定，反映的是「作者认为哪些条件更重要」，
      不是从渔获数据里拟合出来的结果。不同水体与水层的响应差异显著，按本地经验校正比照搬更合理。
    </p>
  </PanelCard>
</template>

<style scoped>
.ft-weights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ft-weight {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 52px;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.ft-weight__label {
  color: var(--ft-text);
}

.ft-weight__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--ft-surface-alt);
  border: 1px solid var(--ft-border);
  overflow: hidden;
}

.ft-weight__fill {
  display: block;
  height: 100%;
  background: var(--ft-accent);
}

.ft-weight__value {
  text-align: right;
  color: var(--ft-text-muted);
}

.ft-weights__foot {
  margin: 14px 0 0;
}
</style>
