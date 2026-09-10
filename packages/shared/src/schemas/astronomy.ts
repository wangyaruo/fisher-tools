import { z } from 'zod'

/** 八分月相。比「农历日期」更适合作为程序内部的判别口径。 */
export const MoonPhaseNameEnum = z.enum([
  'new_moon',
  'waxing_crescent',
  'first_quarter',
  'waxing_gibbous',
  'full_moon',
  'waning_gibbous',
  'last_quarter',
  'waning_crescent',
])
export type MoonPhaseName = z.infer<typeof MoonPhaseNameEnum>

export const MoonInfoSchema = z.object({
  /** 相位，0-1。0 为新月、0.5 为满月、1 回到新月 */
  phase: z.number().min(0).max(1),
  /** 被照亮比例，0-1 */
  illuminatedFraction: z.number().min(0).max(1),
  /** 月龄，单位天，0-29.53 */
  age: z.number(),
  phaseName: MoonPhaseNameEnum,
  phaseNameZh: z.string(),
  /** 地心距离，km */
  distance: z.number(),
  /** 月出、月落、月中天。极区或当天不发生时为 null */
  moonrise: z.string().nullable(),
  moonset: z.string().nullable(),
  /** 月中天（月亮经过当地子午线），solunar 主要活跃时段的依据 */
  transit: z.string().nullable(),
  /** 月下中天，solunar 另一个主要时段的依据 */
  underfoot: z.string().nullable(),
  /** 当前月亮高度角，度。负值表示在地平线以下 */
  altitude: z.number(),
})
export type MoonInfo = z.infer<typeof MoonInfoSchema>

/** 太阳关键时刻。晨昏窗口是淡水路亚与海钓最重要的进食时段。 */
export const SunTimesSchema = z.object({
  sunrise: z.string(),
  sunset: z.string(),
  /** 太阳上中天 */
  solarNoon: z.string(),
  /** 民用晨光始（太阳高度 -6°），肉眼可辨物 */
  civilDawn: z.string(),
  /** 民用暮光终 */
  civilDusk: z.string(),
  /** 航海晨光始（-12°） */
  nauticalDawn: z.string(),
  nauticalDusk: z.string(),
  /** 黄金时段：太阳高度在 -4° 至 6° 之间，光线柔和且鱼类活跃 */
  goldenHourMorningStart: z.string(),
  goldenHourMorningEnd: z.string(),
  goldenHourEveningStart: z.string(),
  goldenHourEveningEnd: z.string(),
  /** 昼长，分钟 */
  dayLengthMinutes: z.number(),
})
export type SunTimes = z.infer<typeof SunTimesSchema>

/** solunar 时段类型。主要时段对应月中天/月下中天，次要对应月出/月落。 */
export const SolunarPeriodSchema = z.object({
  type: z.enum(['major', 'minor']),
  typeLabel: z.string(),
  peak: z.string(),
  start: z.string(),
  end: z.string(),
  basis: z.enum(['moon_transit', 'moon_underfoot', 'moonrise', 'moonset']),
  basisLabel: z.string(),
})
export type SolunarPeriod = z.infer<typeof SolunarPeriodSchema>

export const SolunarDayRatingEnum = z.enum(['poor', 'fair', 'good', 'excellent'])
export type SolunarDayRating = z.infer<typeof SolunarDayRatingEnum>

export const SolunarSchema = z.object({
  periods: z.array(SolunarPeriodSchema),
  /** 当日 solunar 强度评分 0-100，主要由月相盈亏程度决定 */
  score: z.number().min(0).max(100),
  dayRating: SolunarDayRatingEnum,
  dayRatingZh: z.string(),
  /** 方法论说明，必须随结果一起返回，避免用户误当作定论 */
  method: z.string(),
})
export type Solunar = z.infer<typeof SolunarSchema>

/** 天文层聚合结果。 */
export const AstronomyBundleSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  moon: MoonInfoSchema,
  sun: SunTimesSchema,
  solunar: SolunarSchema,
})
export type AstronomyBundle = z.infer<typeof AstronomyBundleSchema>
