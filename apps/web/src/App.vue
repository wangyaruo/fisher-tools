<script setup lang="ts">
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

/**
 * 应用外壳，只做编排：页头（含导航）、路由出口、页脚。
 *
 * 此前品牌区、控件、导航、页脚四段结构连同 130 行样式全部内联在本文件里，
 * 本文件同时承担了三件事：外壳布局、查询条件交互、导航高亮。
 * 拆开后这里只剩「谁在谁上/下」这一件事，改版式的入口也更明确。
 */
</script>

<template>
  <div class="ft-shell">
    <AppHeader />

    <main>
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.ft-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
