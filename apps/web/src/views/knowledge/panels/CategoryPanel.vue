<script setup lang="ts">
import type { KnowledgeCategory } from '@/api/types'
import PanelCard from '@/components/base/PanelCard.vue'

/** 当前选中分类，空串表示「全部」 */
const activeCategory = defineModel<string>({ required: true })

defineProps<{
  categories: KnowledgeCategory[]
  /** 全部文档数，作为「全部分类」这一项的计数 */
  total: number
  counts: Map<string, number>
}>()
</script>

<template>
  <PanelCard title="分类">
    <ul class="ft-cats">
      <li>
        <button
          type="button"
          class="ft-cats__item"
          :class="{ 'is-active': activeCategory === '' }"
          @click="activeCategory = ''"
        >
          <span>全部分类</span>
          <span class="ft-cats__count">{{ total }}</span>
        </button>
      </li>
      <li v-for="item in categories" :key="item.key">
        <button
          type="button"
          class="ft-cats__item"
          :class="{ 'is-active': activeCategory === item.key }"
          @click="activeCategory = item.key"
        >
          <span>{{ item.label }}</span>
          <span class="ft-cats__count">{{ counts.get(item.key) ?? 0 }}</span>
        </button>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.ft-cats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 用 button 而非 li：这是可聚焦、可键盘触发的控件，用列表项会导致键盘无法访问 */
.ft-cats__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--ft-text);
  cursor: pointer;
  text-align: left;
}

.ft-cats__item:hover {
  background: var(--ft-surface-alt);
}

.ft-cats__item.is-active {
  background: var(--ft-accent-soft);
  border-color: #9fe1cb;
  color: var(--ft-accent-strong);
  font-weight: 500;
}

.ft-cats__count {
  font-size: 12px;
  color: var(--ft-text-muted);
  font-variant-numeric: tabular-nums;
}

.ft-cats__item.is-active .ft-cats__count {
  color: var(--ft-accent-strong);
}
</style>
