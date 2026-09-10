<script setup lang="ts">
import { computed } from 'vue'
import type { FishingIndex } from '@fisher-tools/shared/schemas'
import { gradeClass } from '@/utils/format'

const props = defineProps<{ index: FishingIndex }>()

const topPositives = computed(() => props.index.positives.slice(0, 5))
const topNegatives = computed(() => props.index.negatives.slice(0, 5))
</script>

<template>
  <section class="ft-card ft-index">
    <div class="ft-index__head">
      <div class="ft-index__score" :class="gradeClass(index.grade)">
        <span class="ft-index__value">{{ index.score.toFixed(1) }}</span>
        <span class="ft-index__grade">{{ index.gradeLabel }}</span>
      </div>
      <div class="ft-index__summary">
        <h2 class="ft-card__title">钓鱼指数</h2>
        <p class="ft-index__text">{{ index.summary }}</p>
        <div class="ft-index__tags">
          <template v-if="index.bestHours.length > 0">
            <span class="ft-index__taglabel">推荐时段</span>
            <el-tag
              v-for="slot in index.bestHours"
              :key="slot"
              size="small"
              type="success"
              effect="light"
            >
              {{ slot }}
            </el-tag>
          </template>
          <span v-else class="ft-muted">当日无日月主要时段</span>
        </div>
      </div>
    </div>

    <div class="ft-index__factors">
      <div class="ft-index__factorcol">
        <p class="ft-index__factorcoltitle">加分项</p>
        <ul v-if="topPositives.length > 0" class="ft-index__list">
          <li v-for="factor in topPositives" :key="factor.key">
            <span class="ft-index__delta is-positive">+{{ factor.contribution.toFixed(2) }}</span>
            <span class="ft-index__name">{{ factor.label }}</span>
            <span class="ft-index__detail">{{ factor.detail }}</span>
          </li>
        </ul>
        <p v-else class="ft-muted">无</p>
      </div>

      <div class="ft-index__factorcol">
        <p class="ft-index__factorcoltitle">扣分项</p>
        <ul v-if="topNegatives.length > 0" class="ft-index__list">
          <li v-for="factor in topNegatives" :key="factor.key">
            <span class="ft-index__delta is-negative">{{ factor.contribution.toFixed(2) }}</span>
            <span class="ft-index__name">{{ factor.label }}</span>
            <span class="ft-index__detail">{{ factor.detail }}</span>
          </li>
        </ul>
        <p v-else class="ft-muted">无</p>
      </div>
    </div>

    <div v-if="index.targetSpeciesHints.length > 0" class="ft-index__species">
      <span class="ft-muted">目标鱼种提示：</span>
      <span>{{ index.targetSpeciesHints.join('、') }}</span>
    </div>

    <details class="ft-index__caveats">
      <summary>评分依据与局限性（{{ index.caveats.length }} 条）</summary>
      <ul>
        <li v-for="(caveat, i) in index.caveats" :key="i">{{ caveat }}</li>
      </ul>
      <p class="ft-note">
        评分时刻：{{ index.inputs.at }} · 输入快照：
        气压 {{ index.inputs.pressureHpa === null ? '—' : index.inputs.pressureHpa.toFixed(1) }} hPa ·
        3小时变压
        {{
          index.inputs.pressureDelta3h === null
            ? '—'
            : `${index.inputs.pressureDelta3h > 0 ? '+' : ''}${index.inputs.pressureDelta3h.toFixed(2)}`
        }}
        hPa · 气温 {{ index.inputs.temperatureC ?? '—' }} °C · 温差 {{ index.inputs.diurnalRangeC ?? '—' }} °C
      </p>
    </details>
  </section>
</template>

<style scoped>
.ft-index__head {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.ft-index__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 106px;
  padding: 12px 14px;
  border-radius: var(--ft-radius);
  border: 1px solid var(--ft-border);
  background: var(--ft-surface-alt);
}

.ft-index__value {
  font-size: 30px;
  font-weight: 500;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.ft-index__grade {
  margin-top: 2px;
  font-size: 12px;
}

.ft-index__score.is-excellent,
.ft-index__score.is-good {
  border-color: #9fe1cb;
  background: var(--ft-accent-soft);
  color: var(--ft-accent-strong);
}

.ft-index__score.is-fair {
  border-color: #ef9f27;
  background: var(--ft-warn-soft);
  color: #6b4a12;
}

.ft-index__score.is-poor,
.ft-index__score.is-bad {
  border-color: #f09595;
  background: var(--ft-danger-soft);
  color: #7a1717;
}

.ft-index__summary {
  flex: 1;
  min-width: 0;
}

.ft-index__text {
  margin: 0 0 8px;
  font-size: 14px;
}

.ft-index__tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ft-index__taglabel {
  font-size: 12px;
  color: var(--ft-text-muted);
  margin-right: 2px;
}

.ft-index__factors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--ft-border);
}

@media (max-width: 760px) {
  .ft-index__factors {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ft-index__factorcoltitle {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ft-text-muted);
}

.ft-index__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ft-index__list li {
  display: grid;
  grid-template-columns: 54px 84px 1fr;
  gap: 6px;
  align-items: baseline;
  padding: 4px 0;
  font-size: 13px;
}

.ft-index__delta {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.ft-index__delta.is-positive {
  color: var(--ft-accent);
}

.ft-index__delta.is-negative {
  color: var(--ft-danger);
}

.ft-index__name {
  color: var(--ft-text);
}

.ft-index__detail {
  font-size: 12px;
  color: var(--ft-text-muted);
}

.ft-index__species {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--ft-border);
  font-size: 13px;
}

.ft-index__caveats {
  margin-top: 12px;
  font-size: 12px;
}

.ft-index__caveats summary {
  cursor: pointer;
  color: var(--ft-text-muted);
}

.ft-index__caveats ul {
  margin: 8px 0 6px;
  padding-left: 18px;
  color: var(--ft-text-muted);
  line-height: 1.7;
}
</style>
