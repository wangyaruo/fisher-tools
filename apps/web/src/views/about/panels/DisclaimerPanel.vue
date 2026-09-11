<script setup lang="ts">
import { DISCLAIMERS } from '@/data/about'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard title="免责声明">
    <ol class="ft-disclaimers">
      <li v-for="(text, i) in DISCLAIMERS" :key="i">{{ text }}</li>
    </ol>
  </PanelCard>
</template>

<style scoped>
.ft-disclaimers {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  line-height: 1.75;
  color: var(--ft-text-muted);
}
</style>
