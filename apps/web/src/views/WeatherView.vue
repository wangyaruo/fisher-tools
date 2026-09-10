<script setup lang="ts">
import { computed } from 'vue'
import EChart from '@/components/EChart.vue'
import { useOverviewStore } from '@/stores/overview'
import {
  buildDiurnalRangeOption,
  buildPressureOption,
  buildTemperatureOption,
} from '@/utils/charts'
import { hhmm, mmdd, number, signed, windDirection } from '@/utils/format'

const overview = useOverviewStore()
const data = computed(() => overview.data)

const hourly = computed(() => data.value?.hourlyWindow.weather ?? [])

const pressureOption = computed(() =>
  buildPressureOption(hourly.value, {
    baseline: hourly.value[0]?.surfacePressure ?? null,
  }),
)

const temperatureOption = computed(() => buildTemperatureOption(hourly.value))

const diurnalOption = computed(() => buildDiurnalRangeOption(data.value?.diurnalRanges ?? []))

/** 海洋面板是否展示：任一时刻有浪高数据即展示 */
const marineRows = computed(() => {
  const window = data.value?.hourlyWindow
  if (!window) return []
  return window.marine.filter((item) => item.waveHeight !== null).slice(0, 24)
})

const hasMarine = computed(() => marineRows.value.length > 0)

const dailyRows = computed(() => data.value?.daily ?? [])
</script>

<template>
  <div class="ft-page">
    <el-skeleton v-if="overview.loading && !data" :rows="8" animated />

    <el-alert
      v-else-if="overview.error"
      type="error"
      :title="overview.error"
      show-icon
      :closable="false"
    />

    <template v-else-if="data">
      <section class="ft-card">
        <h2 class="ft-card__title">站点气压曲线</h2>
        <p class="ft-card__subtitle">
          窗口 {{ hhmm(data.hourlyWindow.from) }} 起共 {{ hourly.length }} 小时 ·
          当前判定为「{{ data.pressureTrend.tendencyLabel }}」
        </p>
        <EChart :option="pressureOption" height="300px" />
        <p class="ft-note">{{ data.pressureTrend.interpretation }}</p>
        <div class="ft-figures">
          <span>1 小时 <strong>{{ signed(data.pressureTrend.delta1h, 2) }}</strong> hPa</span>
          <span>3 小时 <strong>{{ signed(data.pressureTrend.delta3h, 2) }}</strong> hPa</span>
          <span>6 小时 <strong>{{ signed(data.pressureTrend.delta6h, 2) }}</strong> hPa</span>
          <span>12 小时 <strong>{{ signed(data.pressureTrend.delta12h, 2) }}</strong> hPa</span>
        </div>
      </section>

      <section class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">气温与体感温度</h2>
        <p class="ft-card__subtitle">底色区间为夜间（依据上游昼夜标记）</p>
        <EChart :option="temperatureOption" height="300px" />
      </section>

      <section class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">昼夜温差曲线</h2>
        <p class="ft-card__subtitle">
          柱为日最高与日最低之差，线为白昼均值与夜间均值之差（近 {{ data.diurnalRanges.length }} 日）
        </p>
        <EChart :option="diurnalOption" height="300px" />
      </section>

      <section class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">逐日明细</h2>
        <p class="ft-card__subtitle">气温单位 °C，降水 mm，风速 km/h</p>
        <el-table :data="dailyRows" size="small" stripe>
          <el-table-column label="日期" width="90">
            <template #default="{ row }">{{ mmdd(row.date) }}</template>
          </el-table-column>
          <el-table-column label="最高 / 最低" width="130">
            <template #default="{ row }">{{ number(row.temperatureMax) }} / {{ number(row.temperatureMin) }}</template>
          </el-table-column>
          <el-table-column label="温差" width="80">
            <template #default="{ row }">{{ number(row.temperatureMax - row.temperatureMin) }}</template>
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
      </section>

      <section v-if="hasMarine" class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">海洋数据</h2>
        <p class="ft-card__subtitle">
          该点位上游返回了有效海表数据，因此判定为沿海；浪高与水温直接参与钓鱼指数中的温度因子
        </p>
        <el-table :data="marineRows" size="small" stripe max-height="320">
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
      </section>

      <section v-else class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">海洋数据</h2>
        <p class="ft-note">
          上游未返回有效海表数据，判定该点位为内陆水域，因此不展示浪高与海温，
          钓鱼指数中的温度因子改用气温作为水温代理指标。
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ft-figures {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--ft-text-muted);
}

.ft-figures strong {
  color: var(--ft-text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>
