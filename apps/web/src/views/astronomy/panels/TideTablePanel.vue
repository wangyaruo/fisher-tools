<script setup lang="ts">
import { computed } from 'vue'
import type { TidePrediction, TideWindow, TideWindowKind } from '@fisher-tools/shared/schemas'
import PanelCard from '@/components/base/PanelCard.vue'
import { percent } from '@/utils/format'
import { TIDE_KIND_LABELS, TIDE_KIND_TAG_TYPES } from '@/utils/tide'

const props = defineProps<{
  tide: TidePrediction
}>()

/**
 * el-table 的插槽参数是 any，直接拿它索引 Record 会被 vue-tsc 拒绝
 * （TS7053）。这里包一层带类型的取值函数 —— 而不是在模板里写 as 断言，
 * 那样一旦字段改名，断言会静默失效而不是报错。
 */
function kindLabel(kind: TideWindowKind): string {
  return TIDE_KIND_LABELS[kind]
}

function kindTagType(kind: TideWindowKind): 'warning' | 'info' | 'success' {
  return TIDE_KIND_TAG_TYPES[kind]
}

/** 表格展示的窗口日期区间，去掉年份只留 月-日 */
function windowRange(window: TideWindow): string {
  return `${window.start.slice(5, 10)} – ${window.end.slice(5, 10)}`
}

const subtitle = computed(
  () =>
    `${props.tide.isCoastal ? '当前点位判定为沿海' : '当前点位判定为内陆水域'} · 数据源 ${props.tide.providerName}`,
)
</script>

<template>
  <PanelCard title="潮汐窗口" :subtitle="subtitle">
    <el-table v-if="tide.windows.length > 0" :data="tide.windows" size="small">
      <el-table-column label="窗口" width="150">
        <template #default="{ row }">{{ windowRange(row) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small" effect="light" :type="kindTagType(row.kind)">
            {{ kindLabel(row.kind) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平均照度">
        <template #default="{ row }">{{ percent(row.illuminatedFraction) }}</template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="无潮汐窗口数据" :image-size="72" />

    <p class="ft-disclaimer">{{ tide.disclaimer }}</p>

    <!-- 内陆点位给出替代指标的跳转，避免用户以为「这里没有数据可用」 -->
    <RouterLink v-if="!tide.isCoastal" class="ft-more" to="/weather">
      查看该点位的气温与水体代理指标 →
    </RouterLink>
  </PanelCard>
</template>

