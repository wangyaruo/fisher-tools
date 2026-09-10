<script setup lang="ts">
import { useOverviewStore } from '@/stores/overview'

const overview = useOverviewStore()
</script>

<template>
  <div class="ft-page">
    <el-skeleton v-if="overview.loading && !overview.data" :rows="6" animated />
    <el-alert
      v-else-if="overview.error"
      type="error"
      :title="overview.error"
      show-icon
      :closable="false"
    />
    <el-empty v-else description="知识库页开发中" />
  </div>
</template>
