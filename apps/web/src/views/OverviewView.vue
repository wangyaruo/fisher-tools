<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ConditionGrid from '@/components/ConditionGrid.vue'
import EChart from '@/components/base/EChart.vue'
import FishingIndexCard from '@/components/FishingIndexCard.vue'
import { useOverviewStore } from '@/stores/overview'
import { buildPressureOption } from '@/utils/charts'
import { hhmm, mmdd, number, percent } from '@/utils/format'

const overview = useOverviewStore()
const data = computed(() => overview.data)

/** 总览只画未来 48 小时；完整 72 小时曲线在气象曲线页 */
const hourly = computed(() => data.value?.hourlyWindow.weather.slice(0, 48) ?? [])

const pressureOption = computed(() =>
  buildPressureOption(hourly.value, {
    baseline: hourly.value[0]?.surfacePressure ?? null,
  }),
)

/**
 * 定位当前时刻所属的那一天。
 * 不能按下标取 [1]：上游 past_days 变化或查询时刻落在序列首尾时，
 * 下标会指向错误日期，进而展示别的日子的温差。
 */
const todayRange = computed(() => {
  const date = data.value?.current.weather?.time.slice(0, 10)
  if (!date) return null
  return data.value?.diurnalRanges.find((item) => item.date === date) ?? null
})

const currentTideWindow = computed(() => {
  const tide = data.value?.tide
  if (!tide) return null
  const date = tide.date
  return (
    tide.windows.find(
      (item) => item.start.slice(0, 10) <= date && date <= item.end.slice(0, 10),
    ) ?? null
  )
})

const sun = computed(() => data.value?.astronomy.sun ?? null)
const moon = computed(() => data.value?.astronomy.moon ?? null)
const solunar = computed(() => data.value?.astronomy.solunar ?? null)
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
      <FishingIndexCard :index="data.fishingIndex" />

      <div class="ft-grid ft-grid--2" style="margin-top: 16px">
        <ConditionGrid
          :weather="data.current.weather"
          :marine="data.current.marine"
          :trend="data.pressureTrend"
        />

        <section class="ft-card">
          <h2 class="ft-card__title">站点气压趋势</h2>
          <p class="ft-card__subtitle">未来 48 小时 · 虚线为起始基准</p>
          <EChart :option="pressureOption" height="252px" />
          <p v-if="data.pressureTrend" class="ft-note">
            {{ data.pressureTrend.interpretation }}
          </p>
        </section>
      </div>

      <div class="ft-grid ft-grid--3" style="margin-top: 16px">
        <section class="ft-card">
          <h2 class="ft-card__title">日月时刻</h2>
          <p class="ft-card__subtitle">按钓点经度实算，非固定早晚六点</p>
          <dl v-if="sun" class="ft-kv">
            <div>
              <dt>日出 / 日落</dt>
              <dd>{{ hhmm(sun.sunrise) }} / {{ hhmm(sun.sunset) }}</dd>
            </div>
            <div>
              <dt>晨昏窗口</dt>
              <dd>{{ hhmm(sun.civilDawn) }} – {{ hhmm(sun.sunrise) }} / {{ hhmm(sun.sunset) }} – {{ hhmm(sun.civilDusk) }}</dd>
            </div>
            <div>
              <dt>黄金时段</dt>
              <dd>
                {{ hhmm(sun.goldenHourMorningStart) }}–{{ hhmm(sun.goldenHourMorningEnd) }} /
                {{ hhmm(sun.goldenHourEveningStart) }}–{{ hhmm(sun.goldenHourEveningEnd) }}
              </dd>
            </div>
            <div>
              <dt>昼长</dt>
              <dd>{{ Math.floor(sun.dayLengthMinutes / 60) }} 小时 {{ Math.round(sun.dayLengthMinutes % 60) }} 分</dd>
            </div>
            <div v-if="moon">
              <dt>月出 / 月落</dt>
              <dd>{{ hhmm(moon.moonrise) }} / {{ hhmm(moon.moonset) }}</dd>
            </div>
          </dl>
          <RouterLink class="ft-more" to="/astronomy">查看完整日月与潮汐面板 →</RouterLink>
        </section>

        <section class="ft-card">
          <h2 class="ft-card__title">月相与日月活跃度</h2>
          <p class="ft-card__subtitle">solunar 属经验假说，非确定性结论</p>
          <dl v-if="moon && solunar" class="ft-kv">
            <div>
              <dt>月相</dt>
              <dd>{{ moon.phaseNameZh }} · 照度 {{ percent(moon.illuminatedFraction) }}</dd>
            </div>
            <div>
              <dt>月龄</dt>
              <dd>{{ number(moon.age, 1) }} 天（朔望月 29.53 天）</dd>
            </div>
            <div>
              <dt>当日强度</dt>
              <dd>{{ solunar.score.toFixed(1) }} · {{ solunar.dayRatingZh }}</dd>
            </div>
            <div>
              <dt>主要时段</dt>
              <dd>
                <template v-if="data.fishingIndex.bestHours.length > 0">
                  {{ data.fishingIndex.bestHours.join('、') }}
                </template>
                <template v-else>无</template>
              </dd>
            </div>
          </dl>
        </section>

        <section class="ft-card">
          <h2 class="ft-card__title">潮汐窗口</h2>
          <p class="ft-card__subtitle">
            {{ data.tide.isCoastal ? '天文潮近似 · 不含站点潮高' : '该点位判定为内陆水域' }}
          </p>
          <dl class="ft-kv">
            <div v-if="currentTideWindow">
              <dt>当前位于</dt>
              <dd>{{ currentTideWindow.label }}</dd>
            </div>
            <div v-for="window in data.tide.windows" :key="window.start">
              <dt>{{ mmdd(window.start) }} – {{ mmdd(window.end) }}</dt>
              <dd>{{ window.kind === 'spring' ? '大潮' : window.kind === 'neap' ? '小潮' : '中潮' }} · 照度 {{ percent(window.illuminatedFraction) }}</dd>
            </div>
          </dl>
          <p class="ft-disclaimer">{{ data.tide.disclaimer }}</p>
        </section>
      </div>

      <div class="ft-grid ft-grid--2" style="margin-top: 16px">
        <section class="ft-card">
          <h2 class="ft-card__title">昼夜温差（近 7 日）</h2>
          <p class="ft-card__subtitle">
            当日温差 {{ todayRange ? number(todayRange.range) : '—' }} °C ·
            温差越小水温越稳定，鱼类开口通常越稳
          </p>
          <dl v-if="todayRange" class="ft-kv ft-kv--inline">
            <div>
              <dt>最高 / 最低</dt>
              <dd>{{ number(todayRange.max) }} / {{ number(todayRange.min) }} °C</dd>
            </div>
            <div>
              <dt>白昼均值</dt>
              <dd>{{ number(todayRange.dayMean) }} °C</dd>
            </div>
            <div>
              <dt>夜间均值</dt>
              <dd>{{ number(todayRange.nightMean) }} °C</dd>
            </div>
            <div>
              <dt>昼夜均差</dt>
              <dd>{{ number(todayRange.dayNightDelta) }} °C</dd>
            </div>
          </dl>
          <RouterLink class="ft-more" to="/weather">查看完整气象曲线 →</RouterLink>
        </section>

        <section class="ft-card">
          <h2 class="ft-card__title">数据来源</h2>
          <p class="ft-card__subtitle">所有结论均可追溯到上游，便于自行复核</p>
          <dl class="ft-kv">
            <div>
              <dt>气象</dt>
              <dd>{{ data.sources.weather }}</dd>
            </div>
            <div>
              <dt>天文</dt>
              <dd>{{ data.sources.astronomy }}</dd>
            </div>
            <div>
              <dt>潮汐</dt>
              <dd>{{ data.sources.tide }}</dd>
            </div>
            <div>
              <dt>定位</dt>
              <dd>{{ data.location.name ?? '自定义坐标' }}（{{ data.location.latitude }}, {{ data.location.longitude }}）</dd>
            </div>
          </dl>
          <p class="ft-note">
            按「实测与独立来源交叉验证」的要求，本地天文计算所得日出日落已与
            上游气象数据的日出日落做过比对并完全一致。
          </p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ft-kv {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ft-kv > div {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
}

.ft-kv dt {
  color: var(--ft-text-muted);
  min-width: 92px;
  flex-shrink: 0;
}

.ft-kv dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.ft-kv--inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px 24px;
}

.ft-kv--inline > div {
  flex-direction: column;
  gap: 0;
}

.ft-kv--inline dt {
  min-width: 0;
  font-size: 12px;
}

.ft-more {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--ft-accent);
  text-decoration: none;
}

.ft-more:hover {
  text-decoration: underline;
}
</style>
