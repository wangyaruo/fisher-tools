<script setup lang="ts">
/**
 * 卡片外壳。
 *
 * 「标题 + 副标题 + 右上角操作」这套结构此前在各页面里手写了 19 次，
 * 间距或字号要调整就得改 19 个地方，且极易改漏。收成一个组件后，
 * 版式只有一处定义，调用方只负责给内容。
 *
 * 标题与副标题刻意只接受字符串而不开插槽：这两处的内容在四个页面里
 * 全部是纯文本（含插值），留插槽会让调用方有能力塞进任意标记，
 * 版式随即失去一致性。需要自定义时用 actions 插槽放操作元素。
 */
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="ft-card">
    <header v-if="title || $slots.actions" class="ft-panel__head">
      <div class="ft-panel__heading">
        <h2 v-if="title" class="ft-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="ft-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="ft-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <slot />

    <div v-if="$slots.footer" class="ft-panel__foot">
      <slot name="footer" />
    </div>
  </section>
</template>

<style scoped>
.ft-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.ft-panel__heading {
  min-width: 0;
}

/*
 * 全局 .ft-card__subtitle 自带 14px 下边距，用于「副标题 → 内容」的间隔。
 * 这里间隔已由 .ft-panel__head 的 margin-bottom 承担，需就地清零，
 * 否则两者叠加会出现 28px 的空档。
 */
.ft-panel__heading .ft-card__subtitle {
  margin-bottom: 0;
}

.ft-panel__actions {
  flex-shrink: 0;
}

.ft-panel__foot {
  margin-top: 12px;
}
</style>
