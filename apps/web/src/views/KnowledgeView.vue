<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, api } from '@/api/client'
import type {
  KnowledgeCategory,
  KnowledgeDoc,
  KnowledgeListItem,
  KnowledgeSearchResponse,
} from '@/api/types'

const route = useRoute()
const router = useRouter()

const categories = ref<KnowledgeCategory[]>([])
const items = ref<KnowledgeListItem[]>([])
const listLoading = ref(true)
const listError = ref<string | null>(null)

const activeCategory = ref<string>('')
const query = ref('')
const searchResult = ref<KnowledgeSearchResponse | null>(null)
const searching = ref(false)

const detail = ref<KnowledgeDoc | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

const selectedSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug.length > 0 ? slug : null
})

/** 分类过滤在前端完成：知识库体量小，一次取回后本地筛选比每次往返更快 */
const visibleItems = computed(() =>
  activeCategory.value.length === 0
    ? items.value
    : items.value.filter((item) => item.category === activeCategory.value),
)

const isSearching = computed(() => searchResult.value !== null)

const categoryCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const item of items.value) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
  }
  return counts
})

async function loadList(): Promise<void> {
  listLoading.value = true
  listError.value = null
  try {
    const response = await api.knowledgeList()
    items.value = response.items
  } catch (caught) {
    listError.value = caught instanceof ApiError ? caught.message : '知识库列表加载失败'
  } finally {
    listLoading.value = false
  }
}

async function loadCategories(): Promise<void> {
  try {
    categories.value = await api.knowledgeCategories()
  } catch {
    // 分类清单失败不阻断主流程：列表仍可按全部展示
    categories.value = []
  }
}

async function loadDetail(slug: string): Promise<void> {
  detailLoading.value = true
  detailError.value = null
  try {
    detail.value = await api.knowledgeDoc(slug)
  } catch (caught) {
    detail.value = null
    detailError.value = caught instanceof ApiError ? caught.message : '文档加载失败'
  } finally {
    detailLoading.value = false
  }
}

/**
 * 检索输入防抖。
 * 250ms 是「打字停顿」与「响应及时」之间的折中：再短会在连续输入时
 * 打出大量请求，再长会让用户怀疑没有生效。
 */
let searchTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSearch(value: string): void {
  if (searchTimer !== null) clearTimeout(searchTimer)
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    searchResult.value = null
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(() => {
    void runSearch(trimmed)
  }, 250)
}

async function runSearch(term: string): Promise<void> {
  try {
    const response = await api.knowledgeSearch(term, 20)
    // 输入已被清空或改写时丢弃这次响应，避免旧结果覆盖新结果
    if (query.value.trim() !== term) return
    searchResult.value = response
  } catch {
    searchResult.value = { query: term, total: 0, hits: [] }
  } finally {
    searching.value = false
  }
}

function openDoc(slug: string): void {
  void router.push({ name: 'knowledge', params: { slug } })
}

function clearSearch(): void {
  query.value = ''
  searchResult.value = null
}

/** 回车立即检索，跳过防抖等待 */
function submitSearch(): void {
  if (searchTimer !== null) clearTimeout(searchTimer)
  const trimmed = query.value.trim()
  if (trimmed.length === 0) {
    clearSearch()
    return
  }
  searching.value = true
  void runSearch(trimmed)
}

/**
 * 检索片段高亮。
 *
 * 先转义再插入 <mark>：片段来自知识库正文，但一旦走 v-html，
 * 任何未转义的尖括号都会变成可执行标记。顺序不能反。
 */
function highlight(snippet: string, term: string): string {
  const escaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  if (term.length === 0) return escaped
  const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return escaped.replace(pattern, (match) => `<mark>${match}</mark>`)
}

const renderedBody = computed(() => {
  if (!detail.value) return ''
  // 正文为仓库内置的 Markdown，属可信内容；
  // 若将来支持用户投稿，必须在此处接入 HTML 清洗后再渲染。
  return marked.parse(detail.value.body, { async: false, gfm: true })
})

onMounted(() => {
  void loadCategories()
  void loadList()
})

watch(
  selectedSlug,
  (slug) => {
    if (slug) void loadDetail(slug)
    else detail.value = null
  },
  { immediate: true },
)

watch(query, (value) => scheduleSearch(value))
</script>

<template>
  <div class="ft-page">
    <div class="ft-knowledge">
      <aside class="ft-knowledge__side">
        <section class="ft-card">
          <h2 class="ft-card__title">全文检索</h2>
          <p class="ft-card__subtitle">标题权重 3、标签权重 2、正文权重 1</p>
          <el-input
            v-model="query"
            placeholder="例如：双铅、酒米、禁渔期"
            clearable
            @keyup.enter="submitSearch"
          />
          <p v-if="searching" class="ft-note">检索中…</p>
        </section>

        <section class="ft-card" style="margin-top: 14px">
          <h2 class="ft-card__title">分类</h2>
          <ul class="ft-cats">
            <li>
              <button
                type="button"
                class="ft-cats__item"
                :class="{ 'is-active': activeCategory === '' }"
                @click="activeCategory = ''"
              >
                <span>全部分类</span>
                <span class="ft-cats__count">{{ items.length }}</span>
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
                <span class="ft-cats__count">{{ categoryCounts.get(item.key) ?? 0 }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="ft-card" style="margin-top: 14px">
          <div class="ft-listhead">
            <h2 class="ft-card__title">
              {{ isSearching ? '检索结果' : '文档' }}
            </h2>
            <el-button v-if="isSearching" text size="small" @click="clearSearch">返回列表</el-button>
          </div>

          <el-skeleton v-if="listLoading" :rows="4" animated />

          <el-alert
            v-else-if="listError"
            type="error"
            :title="listError"
            show-icon
            :closable="false"
          />

          <template v-else-if="isSearching && searchResult">
            <p class="ft-note">
              关键词「{{ searchResult.query }}」命中 {{ searchResult.total }} 篇
            </p>
            <ul v-if="searchResult.hits.length > 0" class="ft-docs">
              <li v-for="hit in searchResult.hits" :key="hit.slug">
                <button
                  type="button"
                  class="ft-doc"
                  :class="{ 'is-active': selectedSlug === hit.slug }"
                  @click="openDoc(hit.slug)"
                >
                  <span class="ft-doc__title">{{ hit.title }}</span>
                  <span class="ft-doc__meta">
                    {{ hit.categoryLabel }} · 命中 {{ hit.hitCount }} 次
                  </span>
                  <span
                    class="ft-doc__snippet"
                    v-html="highlight(hit.snippet, searchResult.query)"
                  ></span>
                </button>
              </li>
            </ul>
            <el-empty v-else description="没有匹配的文档" :image-size="64" />
          </template>

          <template v-else>
            <ul v-if="visibleItems.length > 0" class="ft-docs">
              <li v-for="item in visibleItems" :key="item.slug">
                <button
                  type="button"
                  class="ft-doc"
                  :class="{ 'is-active': selectedSlug === item.slug }"
                  @click="openDoc(item.slug)"
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
        </section>
      </aside>

      <section class="ft-knowledge__main">
        <section class="ft-card">
          <el-skeleton v-if="detailLoading" :rows="10" animated />

          <el-alert
            v-else-if="detailError"
            type="error"
            :title="detailError"
            show-icon
            :closable="false"
          />

          <template v-else-if="detail">
            <div class="ft-dochead">
              <div>
                <h1 class="ft-dochead__title">{{ detail.title }}</h1>
                <p class="ft-dochead__meta">
                  {{ detail.categoryLabel }} · {{ detail.wordCount }} 字
                  <template v-if="detail.updatedAt"> · 更新于 {{ detail.updatedAt }}</template>
                </p>
              </div>
            </div>

            <div class="ft-tags">
              <el-tag v-for="tag in detail.tags" :key="tag" size="small" effect="plain">
                {{ tag }}
              </el-tag>
            </div>

            <p class="ft-dochead__summary">{{ detail.summary }}</p>

            <article class="ft-markdown" v-html="renderedBody"></article>
          </template>

          <el-empty v-else description="从左侧选择一篇文档开始阅读" :image-size="96" />
        </section>
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

@media (max-width: 900px) {
  .ft-knowledge {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ft-cats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

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

.ft-listhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.ft-listhead .ft-card__title {
  margin: 0;
}

.ft-docs {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.ft-doc__snippet :deep(mark) {
  background: #fdf3e3;
  color: #6b4a12;
  padding: 0 2px;
  border-radius: 3px;
}

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
