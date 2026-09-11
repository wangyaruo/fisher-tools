<script setup lang="ts">
import { computed, ref } from 'vue'
import { GLOSSARY_GROUPS, GLOSSARY_TOTAL, type GlossaryGroup } from '@/data/glossary'
import TermFilterPanel from './panels/TermFilterPanel.vue'
import TermGroupPanel from './panels/TermGroupPanel.vue'

/**
 * 垂钓术语表。
 *
 * 这一页没有接口请求，数据全部来自本地常量，因此不需要 AsyncSection 的三态处理。
 * 唯一的交互是按关键词过滤，过滤在本地完成：词条总量在百条量级，
 * 本地筛选比往返一次更快，也让输入过程没有等待感。
 */
const keyword = ref('')

const trimmed = computed(() => keyword.value.trim())

/**
 * 过滤时把别称、释义与关联词一并纳入匹配范围。
 * 只匹配术语名是不够的——读者常常记得的是「那个说法」而不是标准词，
 * 例如搜「送漂」应当能找到「顶漂」。
 */
function matchesGroup(group: GlossaryGroup): GlossaryGroup | null {
  if (trimmed.value.length === 0) return group

  const needle = trimmed.value.toLowerCase()
  const terms = group.terms.filter((item) => {
    const haystack = [item.term, ...(item.aliases ?? []), item.explain, ...(item.related ?? [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })

  return terms.length > 0 ? { ...group, terms } : null
}

const filteredGroups = computed(() =>
  GLOSSARY_GROUPS.map(matchesGroup).filter((g): g is GlossaryGroup => g !== null),
)

const matchedCount = computed(() =>
  filteredGroups.value.reduce((sum, g) => sum + g.terms.length, 0),
)
</script>

<template>
  <div class="ft-page">
    <TermFilterPanel
      v-model="keyword"
      :total="GLOSSARY_TOTAL"
      :matched="matchedCount"
      :groups="filteredGroups.length"
    />

    <p v-if="filteredGroups.length === 0" class="ft-card ft-empty">
      没有匹配「{{ trimmed }}」的词条。可以换个说法再试，例如按钓法名、漂相名或天气量名检索。
    </p>

    <TermGroupPanel
      v-for="group in filteredGroups"
      :key="group.key"
      :group="group"
      :keyword="trimmed"
    />
  </div>
</template>

<style scoped>
.ft-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ft-text-muted);
}
</style>
