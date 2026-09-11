<script setup lang="ts">
import type { GlossaryGroup } from '@/data/glossary'
import PanelCard from '@/components/base/PanelCard.vue'
import { highlightSnippet } from '@/utils/highlight'

const props = defineProps<{
  group: GlossaryGroup
  /** 当前检索词，非空时在术语与释义中高亮 */
  keyword: string
}>()

/**
 * 高亮统一走 highlightSnippet：它先转义再插标记。
 * 术语释义里会出现 `<` 之类的符号，顺序反了就会把正文变成可执行标记。
 */
function hl(text: string): string {
  return props.keyword.length > 0 ? highlightSnippet(text, props.keyword) : text
}
</script>

<template>
  <PanelCard :title="group.label" :subtitle="group.intro">
    <dl class="ft-terms">
      <div v-for="item in group.terms" :key="item.term" class="ft-term">
        <dt class="ft-term__head">
          <span class="ft-term__name" v-html="hl(item.term)"></span>
          <span v-if="item.aliases?.length" class="ft-term__alias">
            又称 {{ item.aliases.join(' / ') }}
          </span>
        </dt>
        <dd class="ft-term__body">
          <!-- eslint-disable-next-line vue/no-v-html -- 内容为本地常量，经 highlightSnippet 转义 -->
          <span class="ft-hl" v-html="hl(item.explain)"></span>
          <span v-if="item.related?.length" class="ft-term__related">
            关联：{{ item.related.join('、') }}
          </span>
        </dd>
      </div>
    </dl>
  </PanelCard>
</template>

<style scoped>
.ft-terms {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ft-term {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ft-border);
}

/* 首条不需要分割线：它紧跟在卡片标题下，已有足够间隔 */
.ft-term:first-child {
  padding-top: 0;
  border-top: none;
}

@media (max-width: 760px) {
  .ft-term {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
}

.ft-term__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.ft-term__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ft-text);
}

.ft-term__alias {
  font-size: 11px;
  color: var(--ft-text-muted);
}

.ft-term__body {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ft-text);
}

.ft-term__related {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ft-text-muted);
}
</style>
