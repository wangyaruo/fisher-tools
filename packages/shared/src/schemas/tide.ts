import { z } from 'zod'

/**
 * 潮汐数据源类型。
 * - astronomical_approx：仅依据月相推算朔望大潮/小潮窗口，不给出站点精确潮高
 * - third_party：接入外部站点级潮汐预报，可给出高潮低潮时刻与潮高
 */
export const TideProviderKindEnum = z.enum(['astronomical_approx', 'third_party'])
export type TideProviderKind = z.infer<typeof TideProviderKindEnum>

/** 预报精度等级。前端据此决定是否展示具体潮高数值。 */
export const TidePrecisionEnum = z.enum(['station_level', 'astronomical_only'])
export type TidePrecision = z.infer<typeof TidePrecisionEnum>

export const TideWindowKindEnum = z.enum(['spring', 'neap', 'mid'])
export type TideWindowKind = z.infer<typeof TideWindowKindEnum>

/** 大潮/小潮窗口。窗口内潮差大、潮流强，多数海钓场景更活跃。 */
export const TideWindowSchema = z.object({
  kind: TideWindowKindEnum,
  label: z.string(),
  start: z.string(),
  end: z.string(),
  /** 该窗口的月相照度比例，用于说明判定依据 */
  illuminatedFraction: z.number().min(0).max(1),
})
export type TideWindow = z.infer<typeof TideWindowSchema>

/** 站点级高潮/低潮时刻，仅第三方数据源提供。 */
export const TideExtremeSchema = z.object({
  time: z.string(),
  type: z.enum(['high', 'low']),
  typeLabel: z.string(),
  /** 潮高，m。基准面由数据源定义，必须在 disclaimer 中说明 */
  height: z.number(),
})
export type TideExtreme = z.infer<typeof TideExtremeSchema>

export const TideHourlyHeightSchema = z.object({
  time: z.string(),
  height: z.number(),
})
export type TideHourlyHeight = z.infer<typeof TideHourlyHeightSchema>

export const TidePredictionSchema = z.object({
  provider: TideProviderKindEnum,
  providerName: z.string(),
  precision: TidePrecisionEnum,
  /**
   * 精度声明。天文潮近似与站点实测预报存在本质差异，
   * 必须随数据一起下发给前端展示，不得静默降级。
   */
  disclaimer: z.string(),
  /** 查询日期 */
  date: z.string(),
  /** 查询位置是否判定为沿海 */
  isCoastal: z.boolean(),
  windows: z.array(TideWindowSchema),
  extremes: z.array(TideExtremeSchema).default([]),
  hourlyHeights: z.array(TideHourlyHeightSchema).default([]),
})
export type TidePrediction = z.infer<typeof TidePredictionSchema>
