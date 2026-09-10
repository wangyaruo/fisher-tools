import type { Forecast, GeoPoint } from '@fisher-tools/shared/schemas'

export interface FetchForecastOptions {
  /** 预报天数，默认 7 */
  forecastDays?: number
  /** 回溯天数，用于计算气压趋势，默认 1 */
  pastDays?: number
}

/**
 * 气象数据源抽象。
 *
 * 之所以先定义接口再实现：潮汐与气象都存在「换供应商」的现实可能
 * （免费额度耗尽、接口变更、需要本土化数据），
 * 上层 service 只依赖本接口，替换实现时不必改动业务逻辑。
 */
export interface WeatherProvider {
  /** 内部标识，用于缓存键与日志 */
  readonly name: string
  /** 对外展示的数据来源与许可声明 */
  readonly attribution: string
  fetchForecast(point: GeoPoint, options?: FetchForecastOptions): Promise<Forecast>
}
