import type { FactorKey } from '../schemas'

/**
 * 因子权重表。
 *
 * 设计依据：钓鱼场景里对鱼口影响最大的是「气压变化」与「风」，
 * 其次是「饵料窗口期的月相」与「水温」；云量与降水属次级修正项。
 * 权重之和必须为 1，缺失数据时按剩余因子归一化，见 scoreFishingIndex。
 *
 * 注意：这是启发式模型，不是水产学结论。调整权重前请先看 fishing-index.test.ts
 * 中的基准用例，避免把相对关系调反。
 */
export const FACTOR_WEIGHTS: Record<FactorKey, number> = {
  pressure_trend: 0.2,
  wind: 0.15,
  temperature: 0.1,
  moon_phase: 0.1,
  tide_window: 0.1,
  precipitation: 0.1,
  diurnal_range: 0.08,
  cloud_cover: 0.07,
  pressure_level: 0.05,
  solunar_timing: 0.05,
}

/** 因子中文标签，前后端共用同一份文案，避免两端各写一套。 */
export const FACTOR_LABELS: Record<FactorKey, string> = {
  pressure_trend: '气压趋势',
  pressure_level: '气压水平',
  temperature: '气温',
  diurnal_range: '昼夜温差',
  wind: '风力',
  cloud_cover: '云量',
  moon_phase: '月相盈亏',
  solunar_timing: '日月时段',
  tide_window: '潮汐窗口',
  precipitation: '降水',
}

/** 中性基线。因子得分 50 视为不加不减。 */
export const NEUTRAL_SCORE = 50

/** 因子权重之和的容差，用于自检。 */
export const WEIGHT_SUM_TOLERANCE = 1e-6

/** 校验权重表是否自洽，供测试与启动期断言使用。 */
export function assertWeightsNormalized(): void {
  const total = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0)
  if (Math.abs(total - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error(`因子权重之和应为 1，当前为 ${total}`)
  }
}
