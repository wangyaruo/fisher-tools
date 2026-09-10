<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyWeatherPoint, MarineHourlyPoint, PressureTrend } from '@fisher-tools/shared/schemas'
import { hhmm, number, signed, windDirection } from '@/utils/format'

const props = defineProps<{
  weather: HourlyWeatherPoint | null
  marine: MarineHourlyPoint | null
  trend: PressureTrend | null
}>()

interface Metric {
  label: string
  value: string
  hint?: string
}

const metrics = computed<Metric[]>(() => {
  const weather = props.weather
  if (!weather) return []

  const list: Metric[] = [
    {
      label: '气温',
      value: `${number(weather.temperature)} °C`,
      hint: `体感 ${number(weather.apparentTemperature)} °C`,
    },
    {
      label: '站点气压',
      value: `${number(weather.surfacePressure)} hPa`,
      hint: props.trend
        ? `3 小时变压 ${signed(props.trend.delta3h, 1)} hPa`
        : undefined,
    },
    {
      label: '气压趋势',
      value: props.trend?.tendencyLabel ?? '—',
      hint: props.trend?.ratePerHour != null ? `${signed(props.trend.ratePerHour, 2)} hPa/h` : undefined,
    },
    {
      label: '风',
      value: `${number(weather.windSpeed)} km/h`,
      hint: `${windDirection(weather.windDirection)}风 · 阵风 ${number(weather.windGust)}`,
    },
    {
      label: '云量',
      value: `${number(weather.cloudCover, 0)}%`,
      hint: `紫外线 ${number(weather.uvIndex, 1)}`,
    },
    {
      label: '降水',
      value: `${number(weather.precipitation)} mm`,
      hint: `概率 ${number(weather.precipitationProbability, 0)}%`,
    },
    {
      label: '湿度',
      value: `${number(weather.relativeHumidity, 0)}%`,
      hint: `露点 ${number(weather.dewPoint)} °C`,
    },
    {
      label: '能见度',
      value: weather.visibility >= 1000 ? `${number(weather.visibility / 1000, 1)} km` : `${number(weather.visibility, 0)} m`,
      hint: weather.isDay ? '白昼' : '夜间',
    },
  ]

  if (props.marine && props.marine.seaSurfaceTemperature !== null) {
    list.push({
      label: '海表水温',
      value: `${number(props.marine.seaSurfaceTemperature)} °C`,
      hint:
        props.marine.waveHeight !== null
          ? `浪高 ${number(props.marine.waveHeight)} m · 周期 ${number(props.marine.wavePeriod, 0)} s`
          : '浪高数据缺失',
    })
  }

  return list
})
</script>

<template>
  <section class="ft-card">
    <h2 class="ft-card__title">当前条件</h2>
    <p class="ft-card__subtitle">
      <template v-if="weather">逐小时数据时刻 {{ hhmm(weather.time) }}</template>
      <template v-else>该时刻无逐小时数据</template>
    </p>

    <div v-if="metrics.length > 0" class="ft-conditions">
      <div v-for="metric in metrics" :key="metric.label" class="ft-metric">
        <span class="ft-metric__label">{{ metric.label }}</span>
        <span class="ft-metric__value">{{ metric.value }}</span>
        <span v-if="metric.hint" class="ft-metric__hint">{{ metric.hint }}</span>
      </div>
    </div>
    <el-empty v-else description="无可用数据" :image-size="60" />
  </section>
</template>

<style scoped>
.ft-conditions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 18px;
}

@media (max-width: 900px) {
  .ft-conditions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ft-metric__value {
  font-size: 17px;
}
</style>
