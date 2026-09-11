<script setup lang="ts">
import { LIMITS } from '@/data/about'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard
    title="精度边界"
    subtitle="这些不是免责套话，而是决定结论能不能用的前提"
  >
    <ul class="ft-limits">
      <li v-for="item in LIMITS" :key="item.title" class="ft-limit">
        <p class="ft-limit__title">{{ item.title }}</p>
        <p class="ft-limit__detail">{{ item.detail }}</p>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.ft-limits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ft-limit {
  padding: 12px 14px;
  background: var(--ft-warn-soft);
  border-radius: var(--ft-radius);
}

.ft-limit__title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: #6b4a12;
}

.ft-limit__detail {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: #6b4a12;
}
</style>
