<script setup lang="ts">
import type { FigureItem } from './types'

/**
 * 一排并列的关键数值，用于把「主曲线 + 若干个标量指标」放在同一张卡里。
 * 数值加粗、说明与单位淡化，让眼睛先落在数字上。
 */
defineProps<{
  items: FigureItem[]
}>()
</script>

<template>
  <div class="ft-figures">
    <span v-for="item in items" :key="item.label">
      {{ item.label }} <strong>{{ item.value }}</strong> {{ item.unit ?? '' }}
    </span>
  </div>
</template>
