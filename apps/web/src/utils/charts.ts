import type { BarSeriesOption } from 'echarts/charts'
import type { DiurnalRangePoint, HourlyWeatherPoint, ScoreFactor } from '@fisher-tools/shared/schemas'
import { CHART_COLORS, type ChartOption } from '@/lib/echarts'
import { minutesToHhmm, mmdd, mmddhhmm } from './format'

const AXIS_LABEL = { color: CHART_COLORS.axis, fontSize: 11 }

/** 按数据量稀释横轴标签，避免 72 个刻度挤成一团 */
function labelInterval(count: number, target = 8): number {
  return Math.max(0, Math.ceil(count / target) - 1)
}

interface AxisTooltipFormatterParams {
  seriesName: string
  value: number
  axisValueLabel: string
}

function axisTooltip(unit: string) {
  return {
    trigger: 'axis' as const,
    formatter: (params: unknown) => {
      const list = params as AxisTooltipFormatterParams[]
      if (list.length === 0) return ''
      const head = list[0]!.axisValueLabel
      const rows = list.map(
        (item) => `${item.seriesName}：${item.value.toFixed(1)} ${unit}`,
      )
      return [`<strong>${head}</strong>`, ...rows].join('<br/>')
    },
  }
}

/**
 * 站点气压曲线。
 * 用站点气压而非海平面气压：前者才是钓点实际承受的气压，
 * 跨海拔比较才用后者。
 */
export function buildPressureOption(
  points: readonly HourlyWeatherPoint[],
  options: { baseline?: number | null } = {},
): ChartOption {
  const labels = points.map((point) => mmddhhmm(point.time))
  const baseline = options.baseline ?? null

  return {
    grid: { left: 52, right: 18, top: 26, bottom: 32 },
    tooltip: axisTooltip('hPa'),
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, interval: labelInterval(labels.length) },
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: 'hPa',
      nameTextStyle: AXIS_LABEL,
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    series: [
      {
        type: 'line',
        name: '站点气压',
        data: points.map((point) => point.surfacePressure),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: CHART_COLORS.pressure, width: 2 },
        itemStyle: { color: CHART_COLORS.pressure },
        areaStyle: { color: 'rgba(24, 95, 165, 0.08)' },
        ...(baseline === null
          ? {}
          : {
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { color: CHART_COLORS.apparent, type: 'dashed' as const, width: 1 },
                label: {
                  formatter: `起始 ${baseline} hPa`,
                  color: CHART_COLORS.axis,
                  fontSize: 11,
                  position: 'insideStartTop' as const,
                },
                data: [{ yAxis: baseline }],
              },
            }),
      },
    ],
  }
}

/** 把逐小时的夜间区间合并成 markArea 所需的区间对 */
function nightAreas(points: readonly HourlyWeatherPoint[], labels: readonly string[]) {
  const areas: Array<[{ xAxis: string }, { xAxis: string }]> = []
  let start: string | null = null

  points.forEach((point, index) => {
    const label = labels[index]!
    if (!point.isDay && start === null) {
      start = label
      return
    }
    if (point.isDay && start !== null) {
      areas.push([{ xAxis: start }, { xAxis: labels[index - 1]! }])
      start = null
    }
  })

  if (start !== null && labels.length > 0) {
    areas.push([{ xAxis: start }, { xAxis: labels[labels.length - 1]! }])
  }
  return areas
}

/**
 * 气温与体感温度曲线，夜间区间以底色标出。
 * 标出夜间是为了让「晨昏窗口」在图上可被直接看见，
 * 而不是让用户自己去换算日出日落时间。
 */
export function buildTemperatureOption(points: readonly HourlyWeatherPoint[]): ChartOption {
  const labels = points.map((point) => mmddhhmm(point.time))

  return {
    grid: { left: 46, right: 18, top: 30, bottom: 32 },
    tooltip: axisTooltip('°C'),
    legend: {
      top: 0,
      right: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: CHART_COLORS.axis, fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, interval: labelInterval(labels.length) },
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: '°C',
      nameTextStyle: AXIS_LABEL,
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    series: [
      {
        type: 'line',
        name: '气温',
        data: points.map((point) => point.temperature),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: CHART_COLORS.temperature, width: 2 },
        itemStyle: { color: CHART_COLORS.temperature },
        markArea: {
          silent: true,
          itemStyle: { color: CHART_COLORS.night },
          label: { show: false },
          data: nightAreas(points, labels),
        },
      },
      {
        type: 'line',
        name: '体感温度',
        data: points.map((point) => point.apparentTemperature),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: CHART_COLORS.apparent, width: 1.5, type: 'dashed' },
        itemStyle: { color: CHART_COLORS.apparent },
      },
    ],
  }
}

/**
 * 逐日昼夜温差。
 * 柱为「日最高 − 日最低」的温差，线为「白昼均值 − 夜间均值」，
 * 两者一起看能区分「白天热晚上凉」与「昼夜整体升降」这两种不同情形。
 */
export function buildDiurnalRangeOption(ranges: readonly DiurnalRangePoint[]): ChartOption {
  const labels = ranges.map((range) => mmdd(range.date))

  return {
    grid: { left: 46, right: 18, top: 30, bottom: 32 },
    tooltip: axisTooltip('°C'),
    legend: {
      top: 0,
      right: 0,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: CHART_COLORS.axis, fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: AXIS_LABEL,
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: AXIS_LABEL,
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    series: [
      {
        type: 'bar',
        name: '昼夜温差（极值之差）',
        data: ranges.map((range) => range.range),
        barMaxWidth: 26,
        itemStyle: { color: 'rgba(186, 117, 23, 0.75)', borderRadius: [4, 4, 0, 0] },
      },
      {
        type: 'line',
        name: '昼夜均温差',
        data: ranges.map((range) => range.dayNightDelta),
        smooth: true,
        symbolSize: 6,
        lineStyle: { color: CHART_COLORS.pressure, width: 2 },
        itemStyle: { color: CHART_COLORS.pressure },
      },
    ],
  }
}

/**
 * 钓鱼指数各因子的加减分。
 * 用横向条形图而不是雷达图：雷达图能表现形状但看不出「谁在扣分」，
 * 而加减分排序一眼就能回答「今天差在哪」。
 */
export function buildFactorOption(factors: readonly ScoreFactor[]): ChartOption {
  const sorted = [...factors].sort((a, b) => a.contribution - b.contribution)

  return {
    grid: { left: 84, right: 40, top: 12, bottom: 24 },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = params as { name: string; value: number }
        return `${item.name}：${item.value > 0 ? '+' : ''}${item.value.toFixed(2)} 分`
      },
    },
    xAxis: {
      type: 'value',
      name: '加减分',
      nameTextStyle: AXIS_LABEL,
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((factor) => factor.label),
      axisLabel: { ...AXIS_LABEL, fontSize: 12 },
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    series: [
      {
        type: 'bar',
        name: '加减分',
        data: sorted.map((factor) => ({
          value: factor.contribution,
          itemStyle: {
            color:
              factor.degraded
                ? CHART_COLORS.neutral
                : factor.contribution >= 0
                  ? CHART_COLORS.positive
                  : CHART_COLORS.negative,
            borderRadius: 3,
          },
        })),
        barMaxWidth: 16,
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: CHART_COLORS.axis,
          formatter: (params: unknown) => {
            const item = params as { value: number }
            return `${item.value > 0 ? '+' : ''}${item.value.toFixed(2)}`
          },
        },
      },
    ],
  }
}

/** 时段轴的一行：一行只放一个时段，跨零点的时段在渲染时拆成两段 */
export interface TimelineRow {
  /** y 轴类目文案，需尽量短 */
  label: string
  /** 自当日 00:00 起的分钟数 */
  startMinutes: number
  endMinutes: number
  color: string
}

interface TimelineBar {
  rowIndex: number
  start: number
  end: number
  color: string
  label: string
}

/**
 * 24 小时时段轴（甘特式横条）。
 *
 * 把日月时段、晨昏窗口、潮汐窗口与推荐出钓窗口叠在同一条时间轴上，
 * 是为了回答「几点出门」这一个问题——分散成四张表时，
 * 用户必须自己在脑子里做时间对齐。
 *
 * ECharts 的 bar 没有原生的区间绘制能力，这里用「同 stack 的
 * 透明占位条 + 实色时长条」拼出区间效果：第一段承担左偏移，
 * 第二段承担长度，两段相加即得右端点。
 */
export function buildTimelineOption(
  rows: readonly TimelineRow[],
  options: { nowMinutes?: number | null } = {},
): ChartOption {
  const active = rows.filter(
    (row) =>
      Number.isFinite(row.startMinutes) &&
      Number.isFinite(row.endMinutes) &&
      row.startMinutes !== row.endMinutes,
  )
  const labels = active.map((row) => row.label)

  const bars: TimelineBar[] = []
  active.forEach((row, rowIndex) => {
    const { startMinutes: start, endMinutes: end } = row
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      bars.push({ rowIndex, start, end, color: row.color, label: row.label })
      return
    }
    // 跨零点：当天余下部分与次日开头各成一段
    if (start < 1440) {
      bars.push({ rowIndex, start, end: 1440, color: row.color, label: row.label })
    }
    if (end > 0) {
      bars.push({ rowIndex, start: 0, end, color: row.color, label: row.label })
    }
  })

  const empty = (): string[] => labels.map(() => '-')

  const series: BarSeriesOption[] = bars.flatMap((bar, index) => {
    const offset = empty()
    offset[bar.rowIndex] = String(bar.start)
    const length = empty()
    length[bar.rowIndex] = String(bar.end - bar.start)

    const stack = `bar-${index}`
    const range = `${minutesToHhmm(bar.start)}–${minutesToHhmm(bar.end)}`

    return [
      {
        type: 'bar',
        name: `占位-${index}`,
        stack,
        data: offset,
        silent: true,
        itemStyle: { color: 'transparent' },
        tooltip: { show: false },
        barMaxWidth: 14,
        emphasis: { disabled: true },
      },
      {
        type: 'bar',
        name: bar.label,
        stack,
        data: length,
        barMaxWidth: 14,
        itemStyle: { color: bar.color, borderRadius: 3 },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          fontSize: 11,
          color: CHART_COLORS.axis,
          formatter: range,
        },
        ...(index === 0 && options.nowMinutes != null
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { color: CHART_COLORS.negative, type: 'dashed' as const, width: 1 },
                label: {
                  formatter: `当前 ${minutesToHhmm(options.nowMinutes)}`,
                  color: CHART_COLORS.negative,
                  fontSize: 11,
                  position: 'insideEndTop' as const,
                },
                data: [{ xAxis: options.nowMinutes }],
              },
            }
          : {}),
      },
    ] as BarSeriesOption[]
  })

  return {
    grid: { left: 132, right: 76, top: 14, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const list = (params as Array<{ seriesIndex: number; value: unknown }>).filter(
          (item) => item.seriesIndex % 2 === 1,
        )
        return list
          .map((item) => {
            const bar = bars[(item.seriesIndex - 1) / 2]
            if (!bar) return ''
            return `${bar.label}：${minutesToHhmm(bar.start)}–${minutesToHhmm(bar.end)}`
          })
          .join('<br/>')
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 1440,
      interval: 180,
      axisLabel: { ...AXIS_LABEL, formatter: (value: number) => minutesToHhmm(value) },
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
      splitLine: { lineStyle: { color: CHART_COLORS.split } },
    },
    yAxis: {
      type: 'category',
      data: labels,
      inverse: true,
      axisLabel: { ...AXIS_LABEL, fontSize: 12 },
      axisLine: { lineStyle: { color: CHART_COLORS.split } },
      axisTick: { show: false },
    },
    series,
  }
}
