import { z } from 'zod'

/** 评分因子标识。每个因子对应一个可独立解释、可独立调整权重的维度。 */
export const FactorKeyEnum = z.enum([
  'pressure_trend',
  'pressure_level',
  'temperature',
  'diurnal_range',
  'wind',
  'cloud_cover',
  'moon_phase',
  'solunar_timing',
  'tide_window',
  'precipitation',
])
export type FactorKey = z.infer<typeof FactorKeyEnum>

export const FactorDirectionEnum = z.enum(['positive', 'negative', 'neutral'])
export type FactorDirection = z.infer<typeof FactorDirectionEnum>

/**
 * 单个评分因子的结果。
 * 设计要点：rawScore 与 contribution 分开暴露，前端既能画雷达图，
 * 也能直接列出「哪一项在扣分」，避免只给一个不可解释的总分。
 */
export const ScoreFactorSchema = z.object({
  key: FactorKeyEnum,
  label: z.string(),
  /** 权重，全部因子权重之和为 1 */
  weight: z.number().min(0).max(1),
  /** 该因子的原始得分，0-100，50 视为中性 */
  rawScore: z.number().min(0).max(100),
  /** 该因子对总分的贡献，正值加分、负值扣分、单位为分 */
  contribution: z.number(),
  direction: FactorDirectionEnum,
  /** 人类可读的说明，包含实际观测值 */
  detail: z.string(),
  /** 是否因为缺少数据而降权处理 */
  degraded: z.boolean().default(false),
})
export type ScoreFactor = z.infer<typeof ScoreFactorSchema>

export const FishingGradeEnum = z.enum(['excellent', 'good', 'fair', 'poor', 'bad'])
export type FishingGrade = z.infer<typeof FishingGradeEnum>

/** 参与评分的输入快照。与评分结果一起返回，保证结果可复算、可追溯。 */
export const FishingIndexInputsSchema = z.object({
  at: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  pressureHpa: z.number().nullable(),
  pressureDelta3h: z.number().nullable(),
  temperatureC: z.number().nullable(),
  diurnalRangeC: z.number().nullable(),
  windSpeedKmh: z.number().nullable(),
  windDirectionDeg: z.number().nullable(),
  cloudCoverPct: z.number().nullable(),
  precipitationMm: z.number().nullable(),
  moonIlluminatedFraction: z.number().nullable(),
  moonAgeDays: z.number().nullable(),
  solunarScore: z.number().nullable(),
  tideWindowKind: z.enum(['spring', 'neap', 'mid']).nullable(),
})
export type FishingIndexInputs = z.infer<typeof FishingIndexInputsSchema>

export const FishingIndexSchema = z.object({
  /** 总分，0-100 */
  score: z.number().min(0).max(100),
  grade: FishingGradeEnum,
  gradeLabel: z.string(),
  /** 一句话结论 */
  summary: z.string(),
  /** 加分项，按贡献降序，仅保留正向且非零的因子 */
  positives: z.array(ScoreFactorSchema),
  /** 扣分项，按扣分幅度降序 */
  negatives: z.array(ScoreFactorSchema),
  /** 全部因子明细，含中性项 */
  factors: z.array(ScoreFactorSchema),
  /** 当日推荐出钓时段，取自 solunar 主要时段与晨昏窗口的交集 */
  bestHours: z.array(z.string()),
  /** 目标鱼种提示。属启发式建议，非确定性结论 */
  targetSpeciesHints: z.array(z.string()),
  /**
   * 必须随结果返回的局限性说明。
   * 淡水与海水、不同水体与水层对同一气象条件的响应差别很大，
   * 评分模型只做相对提示，不能替代实地经验。
   */
  caveats: z.array(z.string()),
  inputs: FishingIndexInputsSchema,
  computedAt: z.string(),
})
export type FishingIndex = z.infer<typeof FishingIndexSchema>
