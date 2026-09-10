<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledge'
import CategoryPanel from './panels/CategoryPanel.vue'
import DocDetailPanel from './panels/DocDetailPanel.vue'
import DocListPanel from './panels/DocListPanel.vue'
import SearchPanel from './panels/SearchPanel.vue'

/**
 * 知识库页：左列表右正文。
 *
 * 列表与详情共用同一路由与视图，由 slug 参数区分展示形态 ——
 * 这样每篇文档都有可分享的链接，而不是靠组件内部状态切换。
 * 取数与状态机在 stores/knowledge，本文件只做编排与路由同步。
 */
const library = useKnowledgeStore()
const route = useRoute()
const router = useRouter()

/** 没有 slug 即空态：不请求正文，右侧显示「请选择文档」 */
const selectedSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug.length > 0 ? slug : null
})

onMounted(() => {
  void library.loadCategories()
  void library.loadList()
})

// 分类清单失败不阻断列表，因此两件事各自独立发起，不串行等待
watch(selectedSlug, (slug) => void library.openDetail(slug), { immediate: true })

function openDoc(slug: string): void {
  void router.push({ name: 'knowledge', params: { slug } })
}
</script>

<template>
  <div class="ft-page">
    <div class="ft-knowledge">
      <aside class="ft-side-stack">
        <SearchPanel
          v-model="library.query"
          :searching="library.searching"
          @submit="library.submitSearch()"
        />

        <CategoryPanel
          v-model="library.activeCategory"
          :categories="library.categories"
          :total="library.items.length"
          :counts="library.categoryCounts"
        />

        <DocListPanel
          :loading="library.listLoading"
          :error="library.listError"
          :search-result="library.searchResult"
          :items="library.visibleItems"
          :selected-slug="selectedSlug"
          @select="openDoc"
          @clear-search="library.clearSearch()"
        />
      </aside>

      <section class="ft-knowledge__main">
        <DocDetailPanel
          :detail="library.detail"
          :loading="library.detailLoading"
          :error="library.detailError"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.ft-knowledge {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

/* 窄屏下改为纵向堆叠：320px 侧栏加上正文在平板上会两侧都难读 */
@media (max-width: 900px) {
  .ft-knowledge {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
