<script setup lang="ts">
import type { DailyWeatherPoint } from '@fisher-tools/shared/schemas'
import PanelCard from '@/components/base/PanelCard.vue'
import { hhmm, mmdd, number, windDirection } from '@/utils/format'

/**
 * 逐日明细，用于挑出钓日：
 * 一行内给出气温极值、温差、降水、最大风速与日出日落，
 * 让「哪天适合出门」可以在同一屏里横向比较，而不必翻曲线。
 */
defineProps<{
  rows: DailyWeatherPoint[]
}>()
</script>

<template>
  <PanelCard title="逐日明细" subtitle="气温单位 °C，降水 mm，风速 km/h">
    <el-table :data="rows" size="small" stripe>
      <el-table-column label="日期" width="90">
        <template #default="{ row }">{{ mmdd(row.date) }}</template>
      </el-table-column>
      <el-table-column label="最高 / 最低" width="130">
        <template #default="{ row }">
          {{ number(row.temperatureMax) }} / {{ number(row.temperatureMin) }}
        </template>
      </el-table-column>
      <el-table-column label="温差" width="80">
        <template #default="{ row }">
          {{ number(row.temperatureMax - row.temperatureMin) }}
        </template>
      </el-table-column>
      <el-table-column label="降水" width="80">
        <template #default="{ row }">{{ number(row.precipitationSum) }}</template>
      </el-table-column>
      <el-table-column label="最大风速" width="110">
        <template #default="{ row }">{{ number(row.windSpeedMax) }}</template>
      </el-table-column>
      <el-table-column label="主导风向" width="100">
        <template #default="{ row }">{{ windDirection(row.windDirectionDominant) }}</template>
      </el-table-column>
      <el-table-column label="日出 / 日落">
        <template #default="{ row }">{{ hhmm(row.sunrise) }} / {{ hhmm(row.sunset) }}</template>
      </el-table-column>
    </el-table>
  </PanelCard>
</template>
