<script setup lang="ts">
import DataSourcesPanel from './panels/DataSourcesPanel.vue'
import DisclaimerPanel from './panels/DisclaimerPanel.vue'
import LimitsPanel from './panels/LimitsPanel.vue'
import PageGuidePanel from './panels/PageGuidePanel.vue'
import PurposePanel from './panels/PurposePanel.vue'
import VerificationPanel from './panels/VerificationPanel.vue'

/**
 * 关于本站与使用说明。
 *
 * 这一页是纯静态内容，没有请求也没有状态，因此不引入 store，
 * 也不需要 AsyncSection。顺序按读者的疑问推进：
 * 这是什么 → 怎么用 → 数据从哪来 → 哪里会不准 → 怎么验证的 → 免责声明。
 */
</script>

<template>
  <div class="ft-page">
    <PurposePanel />
    <PageGuidePanel />
    <DataSourcesPanel />
    <LimitsPanel />
    <VerificationPanel />
    <DisclaimerPanel />
  </div>
</template>
