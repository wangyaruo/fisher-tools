<script setup lang="ts">
import { computed } from 'vue'
import {
  FACTOR_GUIDES,
  FACTOR_LABELS,
  FACTOR_WEIGHTS,
} from '@fisher-tools/shared/scoring/guides'
import PanelCard from '@/components/base/PanelCard.vue'

/**
 * 逐因子解读。顺序按权重降序，与权重面板一致 ——
 * 读者看解读时应先读到影响最大的因子，而不是按字母序或随意排列。
 */
const factors = computed(() => {
  const entries = Object.keys(FACTOR_GUIDES) as Array<keyof typeof FACTOR_GUIDES>
  return [...entries]
    .sort((a, b) => FACTOR_WEIGHTS[b] - FACTOR_WEIGHTS[a])
    .map((key) => ({
      key,
      label: FACTOR_LABELS[key],
      weightPercent: (FACTOR_WEIGHTS[key] * 100).toFixed(1),
      guide: FACTOR_GUIDES[key],
    }))
})
</script>

<template>
  <PanelCard title="因子解读" subtitle="每个因子的依据、最有利区间与读法，按权重从大到小排列">
    <ul class="ft-factors">
      <li v-for="item in factors" :key="item.key" class="ft-factor">
        <div class="ft-factor__head">
          <span class="ft-factor__label">{{ item.label }}</span>
          <span class="ft-factor__weight ft-mono">权重 {{ item.weightPercent }}%</span>
        </div>

        <p class="ft-factor__basis">{{ item.guide.basis }}</p>

        <dl class="ft-kv ft-factor__kv">
          <div>
            <dt>最有利</dt>
            <dd>{{ item.guide.best }}</dd>
          </div>
          <div>
            <dt>不利方向</dt>
            <dd>{{ item.guide.worst }}</dd>
          </div>
          <div>
            <dt>怎么读</dt>
            <dd>{{ item.guide.reading }}</dd>
          </div>
        </dl>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.ft-factors {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ft-factor {
  padding-top: 16px;
  border-top: 1px solid var(--ft-border);
}

.ft-factor:first-child {
  padding-top: 0;
  border-top: none;
}

.ft-factor__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ft-factor__label {
  font-size: 14px;
  font-weight: 500;
}

.ft-factor__weight {
  font-size: 12px;
  color: var(--ft-text-muted);
}

.ft-factor__basis {
  margin: 6px 0 8px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ft-text);
}

/*
 * 复用全局 .ft-kv 的「名称—取值」版式，但这里取值较长，
 * 需要比默认 92px 更宽的标签列，并让取值正常换行。
 */
.ft-factor__kv dt {
  min-width: 62px;
}

.ft-factor__kv dd {
  line-height: 1.7;
  font-size: 12px;
  color: var(--ft-text-muted);
}
</style>
