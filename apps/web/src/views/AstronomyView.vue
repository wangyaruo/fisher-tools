<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import EChart from '@/components/EChart.vue'
import MoonPhaseGlyph from '@/components/MoonPhaseGlyph.vue'
import { CHART_COLORS } from '@/lib/echarts'
import { useOverviewStore } from '@/stores/overview'
import { buildTimelineOption, type TimelineRow } from '@/utils/charts'
import { duration, hhmm, minutesOfDay, number, percent } from '@/utils/format'

const overview = useOverviewStore()
const data = computed(() => overview.data)
const astronomy = computed(() => data.value?.astronomy ?? null)
const moon = computed(() => astronomy.value?.moon ?? null)
const sun = computed(() => astronomy.value?.sun ?? null)
const solunar = computed(() => astronomy.value?.solunar ?? null)
const tide = computed(() => data.value?.tide ?? null)

/** 上游逐小时数据均为整点，因此「当前时刻」取所在整点 */
const nowMinutes = computed(() => minutesOfDay(data.value?.current.weather?.time ?? null))

/**
 * 24 小时时段轴的行。
 *
 * 顺序即优先级：推荐窗口在最上，依次是日月时段、黄金时段、晨昏、
 * 潮汐窗口。潮汐窗口是跨日区间，这里按当天裁切后绘制，
 * 避免把数天的窗口画在单日轴上而失真。
 */
const timelineRows = computed<TimelineRow[]>(() => {
  const rows: TimelineRow[] = []
  const index = data.value?.fishingIndex
  const periods = astronomy.value?.solunar.periods ?? []
  const sunTimes = sun.value
  const tideData = tide.value

  index?.bestHours.forEach((slot, position) => {
    const [from, to] = slot.split('-')
    const start = minutesOfDay(from ?? null)
    const end = minutesOfDay(to ?? null)
    if (start === null || end === null) return
    rows.push({
      label: `推荐窗口 ${position + 1}`,
      startMinutes: start,
      endMinutes: end,
      color: CHART_COLORS.best,
    })
  })

  periods.forEach((period) => {
    const start = minutesOfDay(period.start)
    const end = minutesOfDay(period.end)
    if (start === null || end === null) return
    rows.push({
      label: `${period.type === 'major' ? '主要' : '次要'}·${period.basisLabel}`,
      startMinutes: start,
      endMinutes: end,
      color: CHART_COLORS.solunar,
    })
  })

  if (sunTimes) {
    const sunRows: Array<[string, string, string]> = [
      ['黄金时段·晨', sunTimes.goldenHourMorningStart, sunTimes.goldenHourMorningEnd],
      ['黄金时段·昏', sunTimes.goldenHourEveningStart, sunTimes.goldenHourEveningEnd],
      ['民用晨昏·晨', sunTimes.civilDawn, sunTimes.sunrise],
      ['民用晨昏·昏', sunTimes.sunset, sunTimes.civilDusk],
    ]
    for (const [label, from, to] of sunRows) {
      const start = minutesOfDay(from)
      const end = minutesOfDay(to)
      if (start === null || end === null) continue
      rows.push({ label, startMinutes: start, endMinutes: end, color: CHART_COLORS.sun })
    }
  }

  const date = tideData?.date
  tideData?.windows.forEach((window) => {
    if (!date) return
    const startDay = window.start.slice(0, 10)
    const endDay = window.end.slice(0, 10)
    // 只画与当天有交集的窗口，并按当天裁切
    if (date < startDay || date > endDay) return
    const start = startDay === date ? minutesOfDay(window.start) : 0
    const end = endDay === date ? minutesOfDay(window.end) : 1440
    if (start === null || end === null) return
    const kindLabel = window.kind === 'spring' ? '大潮' : window.kind === 'neap' ? '小潮' : '中潮'
    rows.push({
      label: `潮汐·${kindLabel}`,
      startMinutes: start,
      endMinutes: end,
      color: CHART_COLORS.tide,
    })
  })

  return rows
})

const timelineOption = computed(() =>
  buildTimelineOption(timelineRows.value, { nowMinutes: nowMinutes.value }),
)

/** 行高固定，图表高度随行数增长，避免行被压扁 */
const timelineHeight = computed(() => `${Math.max(220, timelineRows.value.length * 32 + 62)}px`)
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

    <template v-else-if="data && astronomy && tide">
      <section class="ft-card ft-moonhead">
        <MoonPhaseGlyph v-if="moon" :phase="moon.phase" :size="108" />

        <div class="ft-moonhead__body">
          <h2 class="ft-card__title">月相</h2>
          <p class="ft-card__subtitle">
            相位以 0 为新月、0.5 为满月；数值由 astronomy-engine 实算，非查表近似
          </p>
          <dl v-if="moon" class="ft-kv">
            <div>
              <dt>月相</dt>
              <dd>{{ moon.phaseNameZh }} · 照度 {{ percent(moon.illuminatedFraction) }}</dd>
            </div>
            <div>
              <dt>月龄</dt>
              <dd>{{ number(moon.age, 2) }} 天（朔望月 29.53 天）</dd>
            </div>
            <div>
              <dt>相位</dt>
              <dd>{{ number(moon.phase, 4) }}</dd>
            </div>
            <div>
              <dt>地心距离</dt>
              <dd>{{ number(moon.distance, 0) }} km</dd>
            </div>
            <div>
              <dt>当前高度角</dt>
              <dd>
                {{ number(moon.altitude, 1) }}°
                <span class="ft-muted">{{ moon.altitude >= 0 ? '（地面以上）' : '（已落至地平线下）' }}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div v-if="solunar" class="ft-moonhead__rating">
          <span class="ft-moonhead__ratinglabel">当日日月强度</span>
          <span class="ft-moonhead__ratingvalue">{{ solunar.score.toFixed(1) }}</span>
          <span class="ft-moonhead__ratinggrade">{{ solunar.dayRatingZh }}</span>
        </div>
      </section>

      <section class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">24 小时时段轴</h2>
        <p class="ft-card__subtitle">
          横轴为钓点当地时间 · 虚线为当前所在整点 ·
          把四类窗口叠在一起，是为了直接回答「几点出门」
        </p>
        <EChart v-if="timelineRows.length > 0" :option="timelineOption" :height="timelineHeight" />
        <el-empty v-else description="当日无可用时段数据" :image-size="72" />
      </section>

      <div class="ft-grid ft-grid--2" style="margin-top: 16px">
        <section class="ft-card">
          <h2 class="ft-card__title">太阳时刻</h2>
          <p class="ft-card__subtitle">按钓点经纬度实算，不套用固定早晚六点</p>
          <dl v-if="sun" class="ft-kv">
            <div>
              <dt>日出 / 日落</dt>
              <dd>{{ hhmm(sun.sunrise) }} / {{ hhmm(sun.sunset) }}</dd>
            </div>
            <div>
              <dt>太阳正午</dt>
              <dd>{{ hhmm(sun.solarNoon) }}</dd>
            </div>
            <div>
              <dt>昼长</dt>
              <dd>{{ duration(sun.dayLengthMinutes) }}</dd>
            </div>
            <div>
              <dt>民用晨昏</dt>
              <dd>
                {{ hhmm(sun.civilDawn) }} – {{ hhmm(sun.sunrise) }} /
                {{ hhmm(sun.sunset) }} – {{ hhmm(sun.civilDusk) }}
              </dd>
            </div>
            <div>
              <dt>航海晨昏</dt>
              <dd>
                {{ hhmm(sun.nauticalDawn) }} – {{ hhmm(sun.civilDawn) }} /
                {{ hhmm(sun.civilDusk) }} – {{ hhmm(sun.nauticalDusk) }}
              </dd>
            </div>
            <div>
              <dt>黄金时段</dt>
              <dd>
                {{ hhmm(sun.goldenHourMorningStart) }}–{{ hhmm(sun.goldenHourMorningEnd) }} /
                {{ hhmm(sun.goldenHourEveningStart) }}–{{ hhmm(sun.goldenHourEveningEnd) }}
              </dd>
            </div>
          </dl>
          <p class="ft-note">
            黄金时段取太阳高度 −4° 至 6° 的区间：此时光线入射角低、水体反差强，
            掠食性鱼种的视觉优势最明显。
          </p>
        </section>

        <section class="ft-card">
          <h2 class="ft-card__title">月亮时刻</h2>
          <p class="ft-card__subtitle">主要时段以中天为基准，次要时段以月出月落为基准</p>
          <dl v-if="moon" class="ft-kv">
            <div>
              <dt>月出 / 月落</dt>
              <dd>{{ hhmm(moon.moonrise) }} / {{ hhmm(moon.moonset) }}</dd>
            </div>
            <div>
              <dt>月中天</dt>
              <dd>{{ hhmm(moon.transit) }}</dd>
            </div>
            <div>
              <dt>月下中天</dt>
              <dd>{{ hhmm(moon.underfoot) }}</dd>
            </div>
          </dl>
          <p class="ft-note">
            高纬度或极昼极夜期间，月出月落当日可能不发生，此时对应字段为空，
            时段表中也不会出现该行。
          </p>
        </section>
      </div>

      <div class="ft-grid ft-grid--2" style="margin-top: 16px">
        <section class="ft-card">
          <h2 class="ft-card__title">日月活跃时段明细</h2>
          <p class="ft-card__subtitle">主要时段前后各 1 小时，次要时段前后各 45 分钟</p>
          <el-table v-if="solunar && solunar.periods.length > 0" :data="solunar.periods" size="small">
            <el-table-column label="类型" width="92">
              <template #default="{ row }">{{ row.typeLabel }}</template>
            </el-table-column>
            <el-table-column label="依据" width="110">
              <template #default="{ row }">{{ row.basisLabel }}</template>
            </el-table-column>
            <el-table-column label="峰值" width="90">
              <template #default="{ row }">{{ hhmm(row.peak) }}</template>
            </el-table-column>
            <el-table-column label="窗口">
              <template #default="{ row }">
                {{ hhmm(row.start) }} – {{ hhmm(row.end) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="当日无日月时段" :image-size="72" />

          <details v-if="solunar" class="ft-caveats">
            <summary>方法论与局限性</summary>
            <p class="ft-note">{{ solunar.method }}</p>
          </details>
        </section>

        <section class="ft-card">
          <h2 class="ft-card__title">潮汐窗口</h2>
          <p class="ft-card__subtitle">
            {{ tide.isCoastal ? '当前点位判定为沿海' : '当前点位判定为内陆水域' }} ·
            数据源 {{ tide.providerName }}
          </p>

          <el-table v-if="tide.windows.length > 0" :data="tide.windows" size="small">
            <el-table-column label="窗口" width="150">
              <template #default="{ row }">
                {{ row.start.slice(5, 10) }} – {{ row.end.slice(5, 10) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="light"
                  :type="row.kind === 'spring' ? 'warning' : row.kind === 'neap' ? 'info' : 'success'"
                >
                  {{ row.kind === 'spring' ? '大潮' : row.kind === 'neap' ? '小潮' : '中潮' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="平均照度">
              <template #default="{ row }">{{ percent(row.illuminatedFraction) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="无潮汐窗口数据" :image-size="72" />

          <p class="ft-disclaimer">{{ tide.disclaimer }}</p>
          <RouterLink v-if="!tide.isCoastal" class="ft-more" to="/weather">
            查看该点位的气温与水体代理指标 →
          </RouterLink>
        </section>
      </div>

      <section class="ft-card" style="margin-top: 16px">
        <h2 class="ft-card__title">数据来源与验证</h2>
        <p class="ft-card__subtitle">所有结论均可追溯到上游，便于自行复核</p>
        <dl class="ft-kv">
          <div>
            <dt>天文计算</dt>
            <dd>{{ data.sources.astronomy }}</dd>
          </div>
          <div>
            <dt>潮汐</dt>
            <dd>{{ data.sources.tide }}</dd>
          </div>
          <div>
            <dt>气压与气温</dt>
            <dd>{{ data.sources.weather }}</dd>
          </div>
        </dl>
        <p class="ft-note">
          交叉验证：本页日出日落由本地 astronomy-engine 实算，已与上游气象数据的
          日出日落字段逐日比对并完全一致。潮汐部分不含站点潮高与具体潮时，
          海钓请以当地海洋预报机构的潮汐表为准。
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ft-moonhead {
  display: flex;
  gap: 22px;
  align-items: flex-start;
}

.ft-moonhead__body {
  flex: 1;
  min-width: 0;
}

.ft-moonhead__rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 128px;
  padding: 14px;
  border-radius: var(--ft-radius);
  border: 1px solid #9fe1cb;
  background: var(--ft-accent-soft);
  color: var(--ft-accent-strong);
}

.ft-moonhead__ratinglabel {
  font-size: 12px;
}

.ft-moonhead__ratingvalue {
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.ft-moonhead__ratinggrade {
  font-size: 12px;
}

@media (max-width: 760px) {
  .ft-moonhead {
    flex-wrap: wrap;
  }
}

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

.ft-caveats {
  margin-top: 12px;
  font-size: 12px;
}

.ft-caveats summary {
  cursor: pointer;
  color: var(--ft-text-muted);
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
