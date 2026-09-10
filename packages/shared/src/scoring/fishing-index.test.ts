import { describe, expect, it } from 'vitest'
import type {
  HourlyWeatherPoint,
  MoonInfo,
  PressureTrend,
  Solunar,
  TideWindowKind,
} from '../schemas'
import { moonActivityFromIllumination, scoreFishingIndex } from './fishing-index'
import { assertWeightsNormalized, FACTOR_WEIGHTS } from './weights'

const TIME_ZONE = 'Asia/Shanghai'

/** 评分基准时刻：2026-09-10 14:00（东八区），非日月活跃窗口 */
const AT = new Date('2026-09-10T14:00:00+08:00')

function makeWeather(overrides: Partial<HourlyWeatherPoint> = {}): HourlyWeatherPoint {
  return {
    time: '2026-09-10T14:00',
    temperature: 22,
    apparentTemperature: 22,
    dewPoint: 15,
    relativeHumidity: 70,
    surfacePressure: 1013,
    pressureMsl: 1013,
    windSpeed: 8,
    windGust: 12,
    windDirection: 90,
    cloudCover: 55,
    precipitation: 0,
    precipitationProbability: 10,
    visibility: 20000,
    uvIndex: 3,
    isDay: true,
    ...overrides,
  }
}

function makeTrend(overrides: Partial<PressureTrend> = {}): PressureTrend {
  return {
    current: 1013,
    delta1h: -0.4,
    delta3h: -1.2,
    delta6h: -2,
    delta12h: -3,
    ratePerHour: -0.4,
    tendency: 'falling',
    tendencyLabel: '缓慢下降',
    interpretation: '测试用',
    ...overrides,
  }
}

const FULL_MOON: MoonInfo = {
  phase: 0.5,
  illuminatedFraction: 1,
  age: 14.77,
  phaseName: 'full_moon',
  phaseNameZh: '满月',
  distance: 384400,
  moonrise: '2026-09-10T18:30',
  moonset: '2026-09-11T05:40',
  transit: '2026-09-10T23:55',
  underfoot: '2026-09-10T11:30',
  altitude: -25,
}

const SOLUNAR: Solunar = {
  periods: [
    {
      type: 'major',
      typeLabel: '主要时段',
      peak: '2026-09-10T23:55',
      start: '2026-09-10T22:55',
      end: '2026-09-11T00:55',
      basis: 'moon_transit',
      basisLabel: '月中天',
    },
    {
      type: 'major',
      typeLabel: '主要时段',
      peak: '2026-09-10T11:30',
      start: '2026-09-10T10:30',
      end: '2026-09-10T12:30',
      basis: 'moon_underfoot',
      basisLabel: '月下中天',
    },
    {
      type: 'minor',
      typeLabel: '次要时段',
      peak: '2026-09-10T18:30',
      start: '2026-09-10T17:45',
      end: '2026-09-10T19:15',
      basis: 'moonrise',
      basisLabel: '月出',
    },
    {
      type: 'minor',
      typeLabel: '次要时段',
      peak: '2026-09-11T05:40',
      start: '2026-09-11T04:55',
      end: '2026-09-11T06:25',
      basis: 'moonset',
      basisLabel: '月落',
    },
  ],
  score: 95,
  dayRating: 'excellent',
  dayRatingZh: '极佳',
  method: '测试夹具',
}

function baseParams(overrides: Record<string, unknown> = {}) {
  return {
    at: AT,
    timeZone: TIME_ZONE,
    location: { latitude: 22.54, longitude: 114.06 },
    weather: makeWeather(),
    pressureTrend: makeTrend(),
    diurnalRange: {
      date: '2026-09-10',
      max: 27,
      min: 22,
      range: 5,
      dayMean: 26,
      nightMean: 22.5,
      dayNightDelta: 3.5,
    },
    tideWindowKind: 'spring' as TideWindowKind,
    ...overrides,
  }
}

describe('权重表', () => {
  it('权重之和为 1，且全部因子均已赋权', () => {
    expect(() => assertWeightsNormalized()).not.toThrow()
    const total = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
  })
})

describe('月相活跃度', () => {
  it('朔望（新月与满月）显著高于上下弦', () => {
    const newMoon = moonActivityFromIllumination(0)
    const fullMoon = moonActivityFromIllumination(1)
    const firstQuarter = moonActivityFromIllumination(0.25)
    const lastQuarter = moonActivityFromIllumination(0.75)
    expect(newMoon).toBeGreaterThan(firstQuarter)
    expect(fullMoon).toBeGreaterThan(firstQuarter)
    expect(firstQuarter).toBeCloseTo(lastQuarter, 5)
    expect(newMoon).toBeCloseTo(95, 5)
    expect(firstQuarter).toBeCloseTo(40, 5)
  })
})

describe('钓鱼指数', () => {
  it('气压缓慢下降的得分高于气压快速上升', () => {
    const falling = scoreFishingIndex(baseParams({ pressureTrend: makeTrend({ delta3h: -1.2 }) }))
    const risingFast = scoreFishingIndex(
      baseParams({ pressureTrend: makeTrend({ delta3h: 4.5, tendency: 'rapidly_rising' }) }),
    )
    expect(falling.score).toBeGreaterThan(risingFast.score)
  })

  it('加减分项之和与总分严格自洽：Σcontribution = score − 50', () => {
    const result = scoreFishingIndex(baseParams())
    const totalContribution = result.factors.reduce((acc, f) => acc + f.contribution, 0)
    expect(50 + totalContribution).toBeCloseTo(result.score, 1)
  })

  it('缺失数据的因子被标记为降权，有效权重之和仍为 1', () => {
    const result = scoreFishingIndex(baseParams({ tideWindowKind: null, diurnalRange: null }))
    const degraded = result.factors.filter((f) => f.degraded)
    const active = result.factors.filter((f) => !f.degraded)
    // baseParams 未提供月相与日月时段，因此这两项同样降权
    expect(degraded.map((f) => f.key).sort()).toEqual([
      'diurnal_range',
      'moon_phase',
      'solunar_timing',
      'tide_window',
    ])
    expect(degraded.every((f) => f.contribution === 0)).toBe(true)
    // 静态权重表保持原值，便于前端展示「本项权重」
    expect(degraded.every((f) => f.weight === FACTOR_WEIGHTS[f.key])).toBe(true)
    // 参与评分的因子静态权重之和 = 1 − 缺失因子权重
    const activeWeightSum = active.reduce((acc, f) => acc + f.weight, 0)
    expect(activeWeightSum).toBeCloseTo(0.67, 6)
    expect(result.caveats.some((c) => c.includes('归一化'))).toBe(true)
  })

  it('满月在日月活跃窗口内的得分高于上弦月且在窗口外', () => {
    const result = scoreFishingIndex({
      ...baseParams(),
      moon: FULL_MOON,
      solunar: SOLUNAR,
    })
    expect(result.factors.every((f) => !f.degraded)).toBe(true)
    expect(result.caveats.some((c) => c.includes('归一化'))).toBe(false)

    const moonFactor = result.factors.find((f) => f.key === 'moon_phase')!
    expect(moonFactor.rawScore).toBeCloseTo(95, 5)

    const inWindow = scoreFishingIndex({
      ...baseParams(),
      moon: FULL_MOON,
      solunar: SOLUNAR,
      at: new Date('2026-09-10T23:10:00+08:00'),
    })
    const timingIn = inWindow.factors.find((f) => f.key === 'solunar_timing')!
    const timingOut = result.factors.find((f) => f.key === 'solunar_timing')!
    expect(timingIn.rawScore).toBeGreaterThan(timingOut.rawScore)
    expect(inWindow.bestHours).toContain('22:55-00:55')
  })

  it('全部输入缺失时退回中性分 50，而不是 0 分或 NaN', () => {
    const result = scoreFishingIndex({
      at: AT,
      timeZone: TIME_ZONE,
      location: { latitude: 22.54, longitude: 114.06 },
      weather: null,
    })
    expect(result.score).toBe(50)
    expect(Number.isNaN(result.score)).toBe(false)
    expect(result.factors.every((f) => f.degraded)).toBe(true)
  })

  it('总分为 0-100 之间有界值，且必需字段齐全', () => {
    const extreme = scoreFishingIndex(
      baseParams({
        weather: makeWeather({ windSpeed: 60, precipitation: 20, surfacePressure: 970, temperature: 38 }),
        pressureTrend: makeTrend({ delta3h: 6 }),
      }),
    )
    expect(extreme.score).toBeGreaterThanOrEqual(0)
    expect(extreme.score).toBeLessThanOrEqual(100)
    expect(extreme.caveats.length).toBeGreaterThan(0)
    expect(extreme.inputs.at).toBe('2026-09-10T14:00')
  })

  it('加分项按贡献降序、扣分项按扣分幅度降序排列', () => {
    const result = scoreFishingIndex(baseParams())
    for (let i = 1; i < result.positives.length; i += 1) {
      expect(result.positives[i - 1]!.contribution).toBeGreaterThanOrEqual(
        result.positives[i]!.contribution,
      )
    }
    for (let i = 1; i < result.negatives.length; i += 1) {
      expect(result.negatives[i - 1]!.contribution).toBeLessThanOrEqual(
        result.negatives[i]!.contribution,
      )
    }
  })
})
