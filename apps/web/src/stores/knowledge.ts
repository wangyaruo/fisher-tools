import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ApiError, api } from '@/api/client'
import type {
  KnowledgeCategory,
  KnowledgeDoc,
  KnowledgeListItem,
  KnowledgeSearchResponse,
} from '@/api/types'

/**
 * 检索输入的防抖时长，毫秒。
 * 这是「打字停顿」与「响应及时」之间的折中：再短会在连续输入时打出大量请求，
 * 再长会让用户怀疑输入没有生效。
 */
const SEARCH_DEBOUNCE_MS = 250

/** 单次检索返回的命中篇数上限 */
const SEARCH_LIMIT = 20

/**
 * 知识库的状态与数据获取。
 *
 * 放在 store 而非视图里，是因为「库状态」与「页面呈现」是两件事：
 * 列表、分类、检索结果、当前正文四份状态彼此耦合（检索态会替换列表、
 * 选中项要跨列表与正文同步），散在视图的 script 里会让视图同时承担
 * 取数、状态机与排版三件事。
 */
export const useKnowledgeStore = defineStore('knowledge', () => {
  const categories = ref<KnowledgeCategory[]>([])
  const items = ref<KnowledgeListItem[]>([])
  const listLoading = ref(true)
  const listError = ref<string | null>(null)

  /** 当前选中的分类，空串表示「全部」 */
  const activeCategory = ref('')

  const query = ref('')
  const searchResult = ref<KnowledgeSearchResponse | null>(null)
  const searching = ref(false)

  const detail = ref<KnowledgeDoc | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)

  /**
   * 分类过滤在前端完成：知识库体量小，一次取回后本地筛选比每次往返更快，
   * 也让切换分类没有等待感。
   */
  const visibleItems = computed(() =>
    activeCategory.value.length === 0
      ? items.value
      : items.value.filter((item) => item.category === activeCategory.value),
  )

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
      // 分类清单失败不阻断主流程：列表仍可按「全部」正常展示，
      // 因此这里刻意不写入错误态，避免整页被一个次要请求拖垮
      categories.value = []
    }
  }

  /** 打开某篇文档；slug 为 null 表示回到「请选择文档」的空态 */
  async function openDetail(slug: string | null): Promise<void> {
    if (slug === null) {
      detail.value = null
      detailError.value = null
      return
    }

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

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function runSearch(term: string): Promise<void> {
    try {
      const response = await api.knowledgeSearch(term, SEARCH_LIMIT)
      // 输入已被清空或改写时丢弃这次响应，避免旧结果覆盖新结果
      if (query.value.trim() !== term) return
      searchResult.value = response
    } catch {
      // 检索失败不打断阅读：退化为空结果，用户仍可用分类浏览
      searchResult.value = { query: term, total: 0, hits: [] }
    } finally {
      searching.value = false
    }
  }

  function scheduleSearch(value: string): void {
    if (searchTimer !== null) clearTimeout(searchTimer)

    const trimmed = value.trim()
    if (trimmed.length === 0) {
      searchResult.value = null
      searching.value = false
      return
    }

    searching.value = true
    searchTimer = setTimeout(() => void runSearch(trimmed), SEARCH_DEBOUNCE_MS)
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

  function clearSearch(): void {
    query.value = ''
    searchResult.value = null
  }

  // 输入变化即触发防抖检索，视图无需关心调度细节
  watch(query, (value) => scheduleSearch(value))

  return {
    categories,
    items,
    listLoading,
    listError,
    activeCategory,
    query,
    searchResult,
    searching,
    detail,
    detailLoading,
    detailError,
    visibleItems,
    categoryCounts,
    loadList,
    loadCategories,
    openDetail,
    submitSearch,
    clearSearch,
  }
})
