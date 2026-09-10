import type { MoonInfo, Solunar, SolunarDayRating, SolunarPeriod } from '../schemas'
import { clamp, round } from '../utils/number'
import { addMinutes, formatLocalDateTime } from '../utils/time'
import { moonActivityFromIllumination } from './moon'

/** 主要时段（月中天、月下中天）前后各延伸的分钟数 */
const MAJOR_HALF_WINDOW_MINUTES = 60
/** 次要时段（月出、月落）前后各延伸的分钟数 */
const MINOR_HALF_WINDOW_MINUTES = 45

const RATING_TABLE: ReadonlyArray<{ min: number; rating: SolunarDayRating; zh: string }> = [
  { min: 85, rating: 'excellent', zh: '极佳' },
  { min: 68, rating: 'good', zh: '较好' },
  { min: 52, rating: 'fair', zh: '一般' },
  { min: 0, rating: 'poor', zh: '较差' },
]

interface PeriodSeed {
  basis: SolunarPeriod['basis']
  basisLabel: string
  type: SolunarPeriod['type']
  peak: string
  halfWindowMinutes: number
}

/**
 * 生成 solunar 时段表。
 *
 * 方法论：以月中天与月下中天为主要时段、月出与月落为次要时段。
 * 该理论由 John Alden Knight 于 1926 年提出，是钓鱼界流传最广的
 * 日月周期假说，但缺乏严格的对照实验支持，因此 method 字段会随结果
 * 一起返回，前端必须原样展示，不能包装成确定性结论。
 */
export function computeSolunar(params: { moon: MoonInfo }): Solunar {
  const { moon } = params

  const seeds: PeriodSeed[] = [
    {
      basis: 'moon_transit',
      basisLabel: '月中天',
      type: 'major',
      peak: moon.transit ?? '',
      halfWindowMinutes: MAJOR_HALF_WINDOW_MINUTES,
    },
    {
      basis: 'moon_underfoot',
      basisLabel: '月下中天',
      type: 'major',
      peak: moon.underfoot ?? '',
      halfWindowMinutes: MAJOR_HALF_WINDOW_MINUTES,
    },
    {
      basis: 'moonrise',
      basisLabel: '月出',
      type: 'minor',
      peak: moon.moonrise ?? '',
      halfWindowMinutes: MINOR_HALF_WINDOW_MINUTES,
    },
    {
      basis: 'moonset',
      basisLabel: '月落',
      type: 'minor',
      peak: moon.moonset ?? '',
      halfWindowMinutes: MINOR_HALF_WINDOW_MINUTES,
    },
  ]

  const periods: SolunarPeriod[] = seeds
    .filter((seed) => seed.peak.length > 0)
    .map((seed) => {
      // 峰值时刻为本地墙上时间字符串，加减窗口后重新格式化即可，
      // 不涉及时区换算，因此直接按分钟数平移
      const [datePart, timePart] = seed.peak.split('T')
      const base = new Date(`${datePart}T${timePart}:00Z`)
      return {
        type: seed.type,
        typeLabel: seed.type === 'major' ? '主要时段' : '次要时段',
        peak: seed.peak,
        start: formatLocalDateTime(addMinutes(base, -seed.halfWindowMinutes), 'UTC'),
        end: formatLocalDateTime(addMinutes(base, seed.halfWindowMinutes), 'UTC'),
        basis: seed.basis,
        basisLabel: seed.basisLabel,
      }
    })
    .sort((a, b) => a.peak.localeCompare(b.peak))

  const score = round(clamp(moonActivityFromIllumination(moon.illuminatedFraction), 0, 100), 1)
  const rating = RATING_TABLE.find((entry) => score >= entry.min) ?? RATING_TABLE[RATING_TABLE.length - 1]!

  return {
    periods,
    score,
    dayRating: rating.rating,
    dayRatingZh: rating.zh,
    method:
      '基于 solunar 理论：以月中天/月下中天为主要时段（前后各 1 小时）、' +
      '月出/月落为次要时段（前后各 45 分钟），强度由月相盈亏程度推算。' +
      '该理论属经验假说，不同水域表现差异较大，建议结合本地渔获记录校验。',
  }
}

/**
 * 按当日日月强度给出「相对其他日子」的说明文案。
 * 用于前端在总览页给出一句可读判断，避免只丢一个数字。
 */
export function describeSolunarStrength(score: number): string {
  if (score >= 85) {
    return '本日属朔望强时段，日月光引力叠加，潮差与夜行性鱼种活跃度同步上升'
  }
  if (score >= 68) return '本日日月强度中等，主要时段仍值得优先安排出钓'
  return '本日属方照弱时段，日月引潮力相互抵消，活跃窗口相对平淡'
}
