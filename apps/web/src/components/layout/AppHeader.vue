<script setup lang="ts">
import { PRESET_LOCATIONS } from '@/config/locations'
import { useLocationStore } from '@/stores/location'
import AppNav from './AppNav.vue'

/**
 * 顶部固定区：品牌信息 + 钓点与时刻控件 + 导航。
 *
 * 钓点与时刻是全局查询条件，改一次全站四个页面同时重取数据，
 * 因此这两组控件必须常驻在页头，而不是下沉到各个页面里。
 * 日期选择器允许留空，留空即「此刻」，这也是最常见的用法。
 */
const store = useLocationStore()
</script>

<template>
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

    <AppNav />
  </header>
</template>

<style scoped>
.ft-header {
  background: var(--ft-surface);
  border-bottom: 1px solid var(--ft-border);
  /* 常驻顶部：切换页面时查询条件不应滚出视野 */
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

/* 用纯 CSS 画一个开口朝上的弧，代替引入图标资源 */
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

/* Element Plus 给日期选择器写了内联宽度，必须用 !important 覆盖 */
.ft-controls__picker {
  width: 220px !important;
}
</style>
