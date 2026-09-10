<script setup lang="ts">
import { computed } from 'vue'
import type { MarineHourlyPoint } from '@fisher-tools/shared/schemas'
import PanelCard from '@/components/base/PanelCard.vue'
import { hhmm, number, windDirection } from '@/utils/format'

const props = defineProps<{
  /** 窗口内的逐小时海洋数据 */
  rows: MarineHourlyPoint[]
}>()

/**
 * 只保留浪高有效的前 24 小时。
 * 上游对内陆点位的海洋请求会返回「有记录但字段全空」的数组，
 * 因此判据取浪高是否为 null，而不是数组长度。
 */
const visibleRows = computed(() =>
  props.rows.filter((item) => item.waveHeight !== null).slice(0, 24),
)

const isCoastal = computed(() => visibleRows.value.length > 0)

const subtitle = computed(() =>
  isCoastal.value
    ? '该点位上游返回了有效海表数据，因此判定为沿海；浪高与水温直接参与钓鱼指数中的温度因子'
    : undefined,
)
</script>

<template>
  <PanelCard title="海洋数据" :subtitle="subtitle">
    <el-table v-if="isCoastal" :data="visibleRows" size="small" stripe max-height="320">
      <el-table-column label="时刻" width="90">
        <template #default="{ row }">{{ hhmm(row.time) }}</template>
      </el-table-column>
      <el-table-column label="浪高 m" width="110">
        <template #default="{ row }">{{ number(row.waveHeight) }}</template>
      </el-table-column>
      <el-table-column label="浪周期 s" width="110">
        <template #default="{ row }">{{ number(row.wavePeriod, 0) }}</template>
      </el-table-column>
      <el-table-column label="浪向" width="110">
        <template #default="{ row }">{{ windDirection(row.waveDirection) }}</template>
      </el-table-column>
      <el-table-column label="海表水温 °C">
        <template #default="{ row }">{{ number(row.seaSurfaceTemperature) }}</template>
      </el-table-column>
    </el-table>

    <!--
      降级路径必须显式说明，不能静默隐藏整块内容：
      用户需要知道「为什么没有浪高」，以及温度因子改用了什么替代指标。
    -->
    <p v-else class="ft-note">
      上游未返回有效海表数据，判定该点位为内陆水域，因此不展示浪高与海温，
      钓鱼指数中的温度因子改用气温作为水温代理指标。
    </p>
  </PanelCard>
</template>
