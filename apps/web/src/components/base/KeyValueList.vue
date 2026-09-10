<script setup lang="ts">
import type { KeyValueItem } from './types'

/**
 * 名称—取值列表。
 *
 * 用一个 items 数组替代手写的 <dl>/<dt>/<dd> 结构（全站 20 处）。
 * 取值统一走「空值渲染为 ——」这一条规则：缺数据时显式留白，
 * 而不是让空字符串把整行撑成看起来「取值为空」的假象。
 *
 * inline 变体用于一行内平铺多个短指标（如当日温差面板）。
 */
withDefaults(
  defineProps<{
    items: KeyValueItem[]
    inline?: boolean
  }>(),
  { inline: false },
)

/** 0 是有效取值，因此不能用真值判断 */
function isBlank(value: KeyValueItem['value']): boolean {
  return value === null || value === undefined || value === ''
}
</script>

<template>
  <dl class="ft-kv" :class="{ 'ft-kv--inline': inline }">
    <div v-for="item in items" :key="item.label">
      <dt>{{ item.label }}</dt>
      <dd>
        {{ isBlank(item.value) ? '—' : item.value }}
        <span v-if="item.hint" class="ft-muted">{{ item.hint }}</span>
      </dd>
    </div>
  </dl>
</template>
