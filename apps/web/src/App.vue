<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PRESET_LOCATIONS } from '@/config/locations'
import { useLocationStore } from '@/stores/location'

const store = useLocationStore()
const route = useRoute()

const navItems = [
  { path: '/', label: '垂钓总览' },
  { path: '/weather', label: '气象曲线' },
  { path: '/astronomy', label: '日月与潮汐' },
  { path: '/knowledge', label: '知识库' },
] as const

const activePath = computed(() => {
  const match = navItems.find(
    (item) => item.path !== '/' && route.path.startsWith(item.path),
  )
  return match?.path ?? '/'
})

const locationHint = computed(() => {
  const parts: string[] = [store.current.water]
  if (store.current.note) parts.push(store.current.note)
  return parts.join(' · ')
})
</script>

<template>
  <div class="ft-shell">
    <header class="ft-header">
      <div class="ft-header__inner">
        <div class="ft-brand">
          <div class="ft-brand__mark" aria-hidden="true"></div>
          <div>
            <h1 class="ft-brand__title">钓鱼助手</h1>
            <p class="ft-brand__desc">
              逐小时气压趋势、昼夜温差曲线、月相与日月活跃时段、潮汐窗口
            </p>
          </div>
        </div>

        <div class="ft-controls">
          <el-select
            :model-value="store.locationKey"
            class="ft-controls__select"
            placeholder="选择钓点"
            @update:model-value="store.setLocation"
          >
            <el-option
              v-for="item in PRESET_LOCATIONS"
              :key="item.key"
              :label="`${item.name}（${item.water}）`"
              :value="item.key"
            />
          </el-select>

          <el-date-picker
            :model-value="store.at"
            type="datetime"
            placeholder="指定出钓时刻（留空为此刻）"
            value-format="YYYY-MM-DDTHH:mm"
            format="YYYY-MM-DD HH:mm"
            class="ft-controls__picker"
            @update:model-value="(value: string | null) => store.setAt(value ?? '')"
          />

          <el-button v-if="store.at" text @click="store.resetAt()">回到此刻</el-button>
        </div>
      </div>

      <nav class="ft-nav">
        <div class="ft-nav__inner">
          <RouterLink
            v-for="item in navItems"
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
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="ft-footer">
      <div class="ft-footer__inner">
        <span>
          气象数据 Open-Meteo（CC BY 4.0）· 天文计算 astronomy-engine ·
          潮汐为天文潮近似，不含站点潮高
        </span>
        <span>钓鱼指数为基于公开数据的相对提示，不构成出钓保证</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.ft-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.ft-header {
  background: var(--ft-surface);
  border-bottom: 1px solid var(--ft-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.ft-header__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px 10px;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.ft-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ft-brand__mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--ft-accent);
  position: relative;
  flex-shrink: 0;
}

.ft-brand__mark::after {
  content: '';
  position: absolute;
  inset: 9px 7px;
  border-bottom: 2px solid #fff;
  border-radius: 0 0 50% 50%;
}

.ft-brand__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
}

.ft-brand__desc {
  margin: 0;
  font-size: 12px;
  color: var(--ft-text-muted);
  line-height: 1.4;
}

.ft-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ft-controls__select {
  width: 190px;
}

.ft-controls__picker {
  width: 220px !important;
}

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

.ft-footer {
  margin-top: auto;
  border-top: 1px solid var(--ft-border);
  background: var(--ft-surface);
}

.ft-footer__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ft-text-muted);
}
</style>
