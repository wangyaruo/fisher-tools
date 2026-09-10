<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeDoc } from '@/api/types'
import AsyncSection from '@/components/base/AsyncSection.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  detail: KnowledgeDoc | null
  loading: boolean
  error: string | null
}>()

const body = computed(() => (props.detail ? renderMarkdown(props.detail.body) : ''))
</script>

<template>
  <PanelCard>
    <AsyncSection
      :loading="loading"
      :error="error"
      :empty="!detail"
      empty-text="从左侧选择一篇文档开始阅读"
      :skeleton-rows="10"
      :empty-image-size="96"
    >
      <template v-if="detail">
        <h1 class="ft-dochead__title">{{ detail.title }}</h1>
        <p class="ft-dochead__meta">
          {{ detail.categoryLabel }} · {{ detail.wordCount }} 字
          <template v-if="detail.updatedAt"> · 更新于 {{ detail.updatedAt }}</template>
        </p>

        <div class="ft-tags">
          <el-tag v-for="tag in detail.tags" :key="tag" size="small" effect="plain">
            {{ tag }}
          </el-tag>
        </div>

        <p class="ft-dochead__summary">{{ detail.summary }}</p>

        <!-- 正文为仓库内置的可信 Markdown；接入用户投稿前必须先做 HTML 清洗 -->
        <article class="ft-markdown" v-html="body"></article>
      </template>
    </AsyncSection>
  </PanelCard>
</template>

<style scoped>
.ft-dochead__title {
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 500;
}

.ft-dochead__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ft-text-muted);
}

.ft-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

/*
 * 摘要用浅底块与正文区分开。它是对全文的浓缩，读者常先看它再决定
 * 是否读下去，因此不能与正文段落长成一个样子。
 */
.ft-dochead__summary {
  margin: 12px 0 0;
  padding: 12px 14px;
  background: var(--ft-surface-alt);
  border-radius: var(--ft-radius);
  font-size: 13px;
  color: var(--ft-text-muted);
  line-height: 1.75;
}
</style>
