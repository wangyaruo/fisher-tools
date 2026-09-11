<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocationStore } from '@/stores/location'

/** 导航项集中在此定义，新增页面只需改这一处 */
const NAV_ITEMS = [
  { path: '/', label: '垂钓总览' },
  { path: '/weather', label: '气象曲线' },
  { path: '/astronomy', label: '日月与潮汐' },
  { path: '/knowledge', label: '知识库' },
  { path: '/glossary', label: '术语表' },
] as const

const store = useLocationStore()
const route = useRoute()

/**
 * 高亮判定用 startsWith 而非全等：
 * /knowledge/:slug 这类带参数的路径与列表页共用同一个导航项，
 * 全等匹配会导致在文档详情页时导航失去高亮。
 * 首页单独处理 —— 所有路径都以 '/' 开头。
 */
const activePath = computed(() => {
  const match = NAV_ITEMS.find(
    (item) => item.path !== '/' && route.path.startsWith(item.path),
  )
  return match?.path ?? '/'
})

/** 水域类型与备注拼成一行提示，让「当前在看哪个钓点」在导航栏就可见 */
const locationHint = computed(() => {
  const parts: string[] = [store.current.water]
  if (store.current.note) parts.push(store.current.note)
  return parts.join(' · ')
})
</script>

<template>
  <nav class="ft-nav">
    <div class="ft-nav__inner">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        class="ft-nav__item"
        :class="{ 'is-active': activePath === item.path }"
      >
        {{ item.label }}
      </RouterLink>
      <span class="ft-nav__hint">{{ store.current.name }} · {{ locationHint }}</span>
    </div>
  </nav>
</template>

<style scoped>
.ft-nav {
  border-top: 1px solid var(--ft-border);
}

.ft-nav__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ft-nav__item {
  padding: 11px 14px;
  font-size: 14px;
  color: var(--ft-text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: color 0.15s;
}

.ft-nav__item:hover {
  color: var(--ft-text);
}

.ft-nav__item.is-active {
  color: var(--ft-accent-strong);
  border-bottom-color: var(--ft-accent);
  font-weight: 500;
}

.ft-nav__hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--ft-text-muted);
}
</style>
