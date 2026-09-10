import type { GeoPoint, TidePrediction, TidePrecision, TideProviderKind } from '@fisher-tools/shared'

export interface FetchTideParams {
  point: GeoPoint
  /** 本地日期 YYYY-MM-DD */
  date: string
  /** 是否判定为沿海钓点。内陆钓点仍会返回天文潮窗口，但前端据此决定是否展示 */
  isCoastal: boolean
}

/**
 * 潮汐数据源抽象。
 *
 * 接入站点级潮汐预报时实现本接口，并把 precision 置为 'station_level'、
 * 填充 extremes 与 hourlyHeights；前端会根据 precision 决定
 * 展示「潮时潮高」还是仅展示「大潮小潮窗口」，无需改动组件逻辑。
 */
export interface TideProvider {
  readonly kind: TideProviderKind
  readonly name: string
  readonly precision: TidePrecision
  /** 精度声明，必须随数据下发 */
  readonly disclaimer: string
  fetchTide(params: FetchTideParams): Promise<TidePrediction>
}
