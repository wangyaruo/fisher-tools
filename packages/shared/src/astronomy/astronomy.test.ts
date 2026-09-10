import { describe, expect, it } from 'vitest'
import { zonedTimeToUtc } from '../utils/time'
import { computeAstronomyBundle, computeMoonInfo, computeSolunar, computeSunTimes } from './index'
import { moonActivityFromIllumination, moonPhaseName } from './moon'

const TIME_ZONE = 'Asia/Shanghai'
/** 深圳，用户常驻地的实际出钓场景 */
const SHENZHEN = { latitude: 22.5431, longitude: 114.0579 }
const DATE = '2026-09-10'

const toMs = (localIso: string): number => zonedTimeToUtc(localIso, TIME_ZONE).getTime()

describe('太阳时刻', () => {
  const sun = computeSunTimes({ date: DATE, timeZone: TIME_ZONE, ...SHENZHEN })

  it('上午与傍晚各时刻严格单调递增', () => {
    const morning = [
      sun.nauticalDawn,
      sun.civilDawn,
      sun.goldenHourMorningStart,
      sun.sunrise,
      sun.goldenHourMorningEnd,
      sun.solarNoon,
    ]
    const evening = [
      sun.solarNoon,
      sun.goldenHourEveningStart,
      sun.sunset,
      sun.goldenHourEveningEnd,
      sun.civilDusk,
      sun.nauticalDusk,
    ]
    for (const chain of [morning, evening]) {
      for (let i = 1; i < chain.length; i += 1) {
        expect(toMs(chain[i]!)).toBeGreaterThan(toMs(chain[i - 1]!))
      }
    }
  })

  it('深圳 9 月的昼长落在 11.5 至 13 小时之间', () => {
    expect(sun.dayLengthMinutes).toBeGreaterThan(690)
    expect(sun.dayLengthMinutes).toBeLessThan(780)
  })

  it('时区与经度不匹配时抛错，而不是返回负的昼长', () => {
    // 深圳坐标配 UTC 时区：以 UTC 零点为锚的 24 小时搜索窗
    // 会把日出与日落取到相邻两天，此时必须显式失败
    expect(() => computeSunTimes({ date: DATE, timeZone: 'UTC', ...SHENZHEN })).toThrow(
      /时区与经纬度是否匹配/,
    )
  })

  it('同一时区下经度不同会显著改变日出的墙上时间', () => {
    // 中国全境统一使用东八区，因此乌鲁木齐（87.6°E）的日出在钟面上明显晚于深圳
    const urumqi = computeSunTimes({
      date: DATE,
      timeZone: TIME_ZONE,
      latitude: 43.8256,
      longitude: 87.6168,
    })
    const diffMinutes = (toMs(urumqi.sunrise) - toMs(sun.sunrise)) / 60_000
    expect(diffMinutes).toBeGreaterThan(90)
  })

  it('黄金时段确实包含日出前后，而非落在正午', () => {
    expect(toMs(sun.goldenHourMorningStart)).toBeLessThan(toMs(sun.sunrise))
    expect(toMs(sun.sunrise)).toBeLessThan(toMs(sun.goldenHourMorningEnd))
    expect(toMs(sun.goldenHourEveningEnd)).toBeGreaterThan(toMs(sun.sunset))
  })
})

describe('月相', () => {
  const moon = computeMoonInfo({ date: DATE, timeZone: TIME_ZONE, ...SHENZHEN })

  it('相位、照度、月龄、距离、高度角均落在有效区间', () => {
    expect(moon.phase).toBeGreaterThanOrEqual(0)
    expect(moon.phase).toBeLessThan(1)
    expect(moon.illuminatedFraction).toBeGreaterThanOrEqual(0)
    expect(moon.illuminatedFraction).toBeLessThanOrEqual(1)
    expect(moon.age).toBeGreaterThanOrEqual(0)
    expect(moon.age).toBeLessThan(29.54)
    expect(moon.distance).toBeGreaterThan(350_000)
    expect(moon.distance).toBeLessThan(410_000)
    expect(moon.altitude).toBeGreaterThanOrEqual(-90)
    expect(moon.altitude).toBeLessThanOrEqual(90)
  })

  it('相位名与相位角自洽', () => {
    expect(moon.phaseName).toBe(moonPhaseName(moon.phase).name)
    expect(moon.phaseNameZh.length).toBeGreaterThan(0)
  })

  it('八分月相在关键节点判定正确', () => {
    expect(moonPhaseName(0).name).toBe('new_moon')
    expect(moonPhaseName(0.25).name).toBe('first_quarter')
    expect(moonPhaseName(0.5).name).toBe('full_moon')
    expect(moonPhaseName(0.75).name).toBe('last_quarter')
    expect(moonPhaseName(1).name).toBe('new_moon')
  })

  it('朔望活跃度高于方照，且落在 40-95 区间', () => {
    expect(moonActivityFromIllumination(0)).toBeGreaterThan(moonActivityFromIllumination(0.25))
    expect(moonActivityFromIllumination(1)).toBeGreaterThan(moonActivityFromIllumination(0.75))
    for (const value of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1]) {
      const score = moonActivityFromIllumination(value)
      expect(score).toBeGreaterThanOrEqual(40)
      expect(score).toBeLessThanOrEqual(95)
    }
  })
})

describe('solunar 时段', () => {
  const moon = computeMoonInfo({ date: DATE, timeZone: TIME_ZONE, ...SHENZHEN })
  const solunar = computeSolunar({ moon })

  it('主要时段跨度 2 小时、次要时段跨度 1.5 小时', () => {
    expect(solunar.periods.length).toBeGreaterThan(0)
    for (const period of solunar.periods) {
      const spanMinutes = (toMs(period.end) - toMs(period.start)) / 60_000
      expect(spanMinutes).toBe(period.type === 'major' ? 120 : 90)
    }
  })

  it('时段按峰值升序，且峰值位于窗口正中', () => {
    const peaks = solunar.periods.map((p) => p.peak)
    expect([...peaks].sort()).toEqual(peaks)
    for (const period of solunar.periods) {
      const mid = (toMs(period.start) + toMs(period.end)) / 2
      expect(Math.abs(mid - toMs(period.peak))).toBeLessThan(60_000)
    }
  })

  it('强度评分与等级自洽，并强制携带方法论说明', () => {
    expect(solunar.score).toBeGreaterThanOrEqual(0)
    expect(solunar.score).toBeLessThanOrEqual(100)
    expect(solunar.dayRatingZh.length).toBeGreaterThan(0)
    // 该理论属经验假说，必须随结果暴露说明，不得当作定论
    expect(solunar.method).toContain('solunar')
  })

  it('缺少月中天时不编造时段，仅跳过该项', () => {
    const noTransit = computeSolunar({ moon: { ...moon, transit: null, underfoot: null } })
    expect(noTransit.periods.some((p) => p.basis === 'moon_transit')).toBe(false)
    expect(noTransit.periods.every((p) => p.peak.length > 0)).toBe(true)
  })
})

describe('天文数据聚合', () => {
  it('一次调用即可产出前端所需的完整结构', () => {
    const bundle = computeAstronomyBundle({ date: DATE, timeZone: TIME_ZONE, ...SHENZHEN })
    expect(bundle.date).toBe(DATE)
    expect(bundle.timezone).toBe(TIME_ZONE)
    expect(bundle.moon.phaseName.length).toBeGreaterThan(0)
    expect(bundle.sun.sunrise).toContain(DATE)
    expect(bundle.solunar.periods.length).toBeGreaterThan(0)
  })

  it('南半球坐标同样可算（不假设北半球）', () => {
    const south = computeAstronomyBundle({
      date: DATE,
      timeZone: 'Australia/Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
    })
    expect(south.sun.dayLengthMinutes).toBeGreaterThan(0)
    expect(south.moon.distance).toBeGreaterThan(350_000)
  })
})
