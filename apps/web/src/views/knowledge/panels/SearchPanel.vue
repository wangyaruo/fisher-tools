<script setup lang="ts">
import PanelCard from '@/components/base/PanelCard.vue'

/** 关键词输入。防抖与请求调度在 store 里，这里只负责输入与回车 */
const query = defineModel<string>({ required: true })

defineProps<{
  searching: boolean
}>()

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <PanelCard title="全文检索" subtitle="标题权重 3、标签权重 2、正文权重 1">
    <el-input
      v-model="query"
      placeholder="例如：双铅、酒米、禁渔期"
      clearable
      @keyup.enter="emit('submit')"
    />
    <p v-if="searching" class="ft-note">检索中…</p>
  </PanelCard>
</template>
