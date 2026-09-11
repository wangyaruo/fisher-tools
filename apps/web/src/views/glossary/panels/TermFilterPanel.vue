<script setup lang="ts">
import PanelCard from '@/components/base/PanelCard.vue'

/**
 * 术语检索。
 *
 * 输入即过滤，不设按钮、不做防抖 —— 过滤在本地内存里完成，
 * 不存在请求开销，此时加防抖只会让输入看起来卡顿。
 */
const keyword = defineModel<string>({ required: true })

defineProps<{
  /** 词条总数 */
  total: number
  /** 当前命中的词条数 */
  matched: number
  /** 当前命中的分组数 */
  groups: number
}>()
</script>

<template>
  <PanelCard title="垂钓术语表" subtitle="按关键词过滤，可搜术语名、别称、释义与关联词">
    <template #actions>
      <el-button v-if="keyword.length > 0" text size="small" @click="keyword = ''">
        清除
      </el-button>
    </template>

    <el-input
      v-model="keyword"
      placeholder="例如：送漂、吃铅、走水、滑口"
      clearable
    />

    <p class="ft-note ft-termfilter__stat">
      <template v-if="keyword.trim().length > 0">
        命中 {{ matched }} 条，分布在 {{ groups }} 组
      </template>
      <template v-else> 收录 {{ total }} 条术语，共 6 组 </template>
    </p>
  </PanelCard>
</template>

<style scoped>
.ft-termfilter__stat {
  margin: 10px 0 0;
}
</style>
