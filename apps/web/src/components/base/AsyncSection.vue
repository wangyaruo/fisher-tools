<script setup lang="ts">
/**
 * 异步三态容器：加载中 / 出错 / 无数据。
 *
 * 这三条分支此前在每个页面各手写一遍。手写的问题不只是重复 ——
 * 更容易漏掉「不加载、不报错、但没有数据」这条最隐蔽的分支，
 * 漏了就会在看到结果前先看到一片空白，且不报任何错。
 * 收进组件后三个分支的优先级固定为 加载中 > 出错 > 无数据 > 内容。
 */
withDefaults(
  defineProps<{
    loading?: boolean
    error?: string | null
    /** 无数据；仅在既未加载中也未出错时才生效 */
    empty?: boolean
    emptyText?: string
    /** 骨架行数，按各页面内容高度给不同值 */
    skeletonRows?: number
    emptyImageSize?: number
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    emptyText: '暂无数据',
    skeletonRows: 8,
    emptyImageSize: 72,
  },
)
</script>

<template>
  <el-skeleton v-if="loading" :rows="skeletonRows" animated />
  <el-alert v-else-if="error" type="error" :title="error" show-icon :closable="false" />
  <el-empty v-else-if="empty" :description="emptyText" :image-size="emptyImageSize" />
  <slot v-else />
</template>
