import { beforeAll, describe, expect, it } from 'vitest'
import type { DiurnalRangePoint, HourlyWeatherPoint, ScoreFactor } from '@fisher-tools/shared/schemas'
import type { TimelineRow } from './charts'

/**
 * charts.ts 的色板 getter 会在「构建 option 时」读取 document（判断暗色模式），
 * 且模块顶层常量也会触发一次读取。node 环境没有 document，
 * 因此在动态导入被测模块之前先安装一个浅色模式的桩。
 * echarts 本体不接触 DOM，可在 node 中正常导入。
 */
type ChartsModule = typeof import('./charts')
let charts: ChartsModule

beforeAll(async () => {
  ;(globalThis as { document?: unknown }).document = {
    documentElement: { classList: { contains: () => false } },
  }
  charts = await import('./charts')
})

/** 浅色模式下的期望色值（与 lib/echarts.ts 的亮色定义一致） */
const LIGHT = {
  positive: '#c14f74',
  negative: '#5f7f95',
  neutral: '#978a83',
}

const hp = (over: Partial<HourlyWeatherPoint>): HourlyWeatherPoint => over as HourlyWeatherPoint
const factor = (over: Partial<ScoreFactor>): ScoreFactor => over as ScoreFactor

interface SeriesLike {
  data: unknown
  markLine?: { data: Array<Record<string, unknown>> }
  markArea?: { data: unknown[] }
  itemStyle?: { color?: string }
}

interface OptionLike {
  xAxis?: { data?: string[] }
  yAxis?: { data?: string[] }
  series: SeriesLike[]
  tooltip?: { formatter?: (params: unknown) => string }
}

describe('buildTimelineOption', () => {
  const build = (rows: TimelineRow[], now?: number | null) =>
    charts.buildTimelineOption(rows, { nowMinutes: now }) as unknown as OptionLike

  it('普通时段渲染为「占位条 + 实色条」一对序列', () => {
    const option = build([{ label: '日出', startMinutes: 360, endMinutes: 480, color: '#c07a1f' }])

    expect(option.yAxis?.data).toEqual(['日出'])
    expect(option.series).toHaveLength(2)
    // 占位条透明且 length 条带实际时长（480-360=120）
    expect(option.series[0]!.data).toEqual(['360'])
    expect(option.series[1]!.data).toEqual(['120'])
  })

  it('跨零点的时段拆成「当天余量 + 次日开头」两段', () => {
    const option = build([{ label: '夜钓', startMinutes: 1200, endMinutes: 120, color: '#000' }])

    // 两段各一对序列，共 4 个
    expect(option.series).toHaveLength(4)
    expect(option.series[0]!.data).toEqual(['1200'])
    expect(option.series[1]!.data).toEqual(['240']) // 1440-1200
    expect(option.series[2]!.data).toEqual(['0'])
    expect(option.series[3]!.data).toEqual(['120'])
  })

  it('起止相同或非法的时段被过滤', () => {
    const option = build([
      { label: '空', startMinutes: 100, endMinutes: 100, color: '#000' },
      { label: '坏', startMinutes: Number.NaN, endMinutes: 100, color: '#000' },
    ])

    expect(option.yAxis?.data).toEqual([])
    expect(option.series).toHaveLength(0)
  })

  it('给定当前时刻时在首条序列上画 markLine', () => {
    const withNow = build(
      [{ label: '日出', startMinutes: 360, endMinutes: 480, color: '#c07a1f' }],
      420,
    )
    const withoutNow = build([
      { label: '日出', startMinutes: 360, endMinutes: 480, color: '#c07a1f' },
    ])

    expect(withNow.series[1]!.markLine?.data).toEqual([{ xAxis: 420 }])
    expect(withoutNow.series[1]!.markLine).toBeUndefined()
  })

  it('tooltip 只显示实色条（奇数序列）', () => {
    const option = build([{ label: '夜钓', startMinutes: 1200, endMinutes: 120, color: '#000' }])
    const text = option.tooltip?.formatter?.([{ seriesIndex: 1, value: '240' }])

    expect(text).toContain('夜钓：20:00–00:00')
  })
})

describe('buildFactorOption', () => {
  it('按加减分升序排列，降级因子置灰、正负分着色', () => {
    const option = charts.buildFactorOption([
      factor({ label: '气压趋势', contribution: 4, degraded: false }),
      factor({ label: '风力', contribution: -2.5, degraded: false }),
      factor({ label: '潮汐', contribution: 0, degraded: true }),
    ]) as unknown as OptionLike

    expect(option.yAxis?.data).toEqual(['风力', '潮汐', '气压趋势'])

    const colors = (option.series[0]!.data as Array<{ itemStyle: { color: string } }>).map(
      (item) => item.itemStyle.color,
    )
    expect(colors).toEqual([LIGHT.negative, LIGHT.neutral, LIGHT.positive])
  })
})

describe('buildPressureOption', () => {
  const points = [
    hp({ time: '2026-09-18T08:00', surfacePressure: 1012 }),
    hp({ time: '2026-09-18T09:00', surfacePressure: 1011 }),
  ]

  it('无基准线时不生成 markLine，有基准线时画在对应气压值', () => {
    const plain = charts.buildPressureOption(points) as unknown as OptionLike
    expect(plain.series[0]!.markLine).toBeUndefined()

    const withBaseline = charts.buildPressureOption(points, {
      baseline: 1013,
    }) as unknown as OptionLike
    expect(withBaseline.series[0]!.markLine?.data).toEqual([{ yAxis: 1013 }])
  })
})

describe('buildTemperatureOption 的夜间区间', () => {
  it('连续的夜间小时合并为一个区间，结尾未闭合的区间补到最后一点', () => {
    const points = [
      hp({ time: '2026-09-18T08:00', isDay: true, temperature: 26, apparentTemperature: 27 }),
      hp({ time: '2026-09-18T20:00', isDay: false, temperature: 22, apparentTemperature: 23 }),
      hp({ time: '2026-09-18T21:00', isDay: false, temperature: 21, apparentTemperature: 22 }),
      hp({ time: '2026-09-19T06:00', isDay: true, temperature: 20, apparentTemperature: 20 }),
      hp({ time: '2026-09-19T19:00', isDay: false, temperature: 23, apparentTemperature: 24 }),
    ]

    const option = charts.buildTemperatureOption(points) as unknown as OptionLike
    const areas = option.series[0]!.markArea?.data as Array<[{ xAxis: string }, { xAxis: string }]>

    expect(areas).toHaveLength(2)
    expect(areas[0]).toEqual([{ xAxis: '09-18 20:00' }, { xAxis: '09-18 21:00' }])
    expect(areas[1]).toEqual([{ xAxis: '09-19 19:00' }, { xAxis: '09-19 19:00' }])
  })
})

describe('buildDiurnalRangeOption', () => {
  it('柱为极值温差、线为昼夜均温差', () => {
    const ranges = [
      { date: '2026-09-18', range: 8.5, dayNightDelta: 3.2 } as DiurnalRangePoint,
    ] as DiurnalRangePoint[]
    const option = charts.buildDiurnalRangeOption(ranges) as unknown as OptionLike

    expect(option.series[0]!.data).toEqual([8.5])
    expect(option.series[1]!.data).toEqual([3.2])
  })
})
