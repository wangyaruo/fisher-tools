<script setup lang="ts">
import { PAGE_GUIDES } from '@/data/about'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard title="各页面怎么用" subtitle="按「你想知道什么」找页面，而不是按功能名找">
    <ul class="ft-guides">
      <li v-for="guide in PAGE_GUIDES" :key="guide.path" class="ft-guide">
        <div class="ft-guide__head">
          <RouterLink :to="guide.path" class="ft-guide__link">{{ guide.label }}</RouterLink>
          <span class="ft-guide__question">{{ guide.question }}</span>
        </div>
        <p class="ft-guide__content">{{ guide.content }}</p>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.ft-guides {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ft-guide {
  padding-top: 12px;
  border-top: 1px solid var(--ft-border);
}

.ft-guide:first-child {
  padding-top: 0;
  border-top: none;
}

.ft-guide__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.ft-guide__link {
  font-size: 14px;
  font-weight: 500;
  color: var(--ft-accent);
  text-decoration: none;
}

.ft-guide__link:hover {
  text-decoration: underline;
}

.ft-guide__question {
  font-size: 12px;
  color: var(--ft-text-muted);
}

.ft-guide__content {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.75;
}

/*
 * 移除 .ft-page > * + * 之外的最后一条分割线：
 * 列表本身已用 border-top 分隔，最后一项下方再无内容。
 */
.ft-guide:last-child {
  padding-bottom: 0;
}
</style>
