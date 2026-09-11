<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeListItem, KnowledgeSearchResponse } from '@/api/types'
import AsyncSection from '@/components/base/AsyncSection.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import { highlightSnippet } from '@/utils/highlight'

const props = defineProps<{
  loading: boolean
  error: string | null
  /** 非 null 表示处于检索态，列表被检索结果整体替换 */
  searchResult: KnowledgeSearchResponse | null
  /** 非检索态下要展示的文档列表（已按分类过滤） */
  items: KnowledgeListItem[]
  selectedSlug: string | null
}>()

const emit = defineEmits<{
  select: [slug: string]
  clearSearch: []
}>()

const title = computed(() => (props.searchResult ? '检索结果' : '文档'))
</script>

<template>
  <PanelCard :title="title">
    <template #actions>
      <el-button v-if="searchResult" text size="small" @click="emit('clearSearch')">
        返回列表
      </el-button>
    </template>

    <AsyncSection :loading="loading" :error="error" :skeleton-rows="4">
      <template v-if="searchResult">
        <p class="ft-note">
          关键词「{{ searchResult.query }}」命中 {{ searchResult.total }} 篇
        </p>
        <ul v-if="searchResult.hits.length > 0" class="ft-docs">
          <li v-for="hit in searchResult.hits" :key="hit.slug">
            <button
              type="button"
              class="ft-doc"
              :class="{ 'is-active': selectedSlug === hit.slug }"
              @click="emit('select', hit.slug)"
            >
              <span class="ft-doc__title">{{ hit.title }}</span>
              <span class="ft-doc__meta">
                {{ hit.categoryLabel }} · 命中 {{ hit.hitCount }} 次
              </span>
              <!-- 片段在 highlightSnippet 内先转义再插标记，顺序不能反 -->
              <span
                class="ft-doc__snippet ft-hl"
                v-html="highlightSnippet(hit.snippet, searchResult.query)"
              ></span>
            </button>
          </li>
        </ul>
        <el-empty v-else description="没有匹配的文档" :image-size="64" />
      </template>

      <template v-else>
        <ul v-if="items.length > 0" class="ft-docs">
          <li v-for="item in items" :key="item.slug">
            <button
              type="button"
              class="ft-doc"
              :class="{ 'is-active': selectedSlug === item.slug }"
              @click="emit('select', item.slug)"
            >
              <span class="ft-doc__title">{{ item.title }}</span>
              <span class="ft-doc__meta">
                {{ item.categoryLabel }} · {{ item.wordCount }} 字 ·
                {{ item.tags.slice(0, 3).join(' / ') }}
              </span>
              <span class="ft-doc__snippet">{{ item.summary }}</span>
            </button>
          </li>
        </ul>
        <el-empty v-else description="该分类下暂无文档" :image-size="64" />
      </template>
    </AsyncSection>
  </PanelCard>
</template>

<style scoped>
.ft-docs {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 列表独立滚动，避免文档多时把整个侧栏撑长、正文被推走 */
  max-height: 62vh;
  overflow-y: auto;
}

.ft-doc {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 11px;
  border: 1px solid var(--ft-border);
  border-radius: var(--ft-radius);
  background: var(--ft-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ft-doc:hover {
  border-color: #9fe1cb;
}

.ft-doc.is-active {
  border-color: var(--ft-accent);
  background: var(--ft-accent-soft);
}

.ft-doc__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ft-text);
}

.ft-doc__meta {
  font-size: 11px;
  color: var(--ft-text-muted);
}

.ft-doc__snippet {
  font-size: 12px;
  color: var(--ft-text-muted);
  line-height: 1.6;
}
</style>
