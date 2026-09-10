import type { TidePrediction } from '@fisher-tools/shared'
import type { FetchTideParams, TideProvider } from './types.js'
import { buildTideWindows } from './windows.js'

export class AstronomicalTideProvider implements TideProvider {
  readonly kind = 'astronomical_approx' as const
  readonly name = '本地天文潮推算'
  readonly precision = 'astronomical_only' as const

  /**
   * 精度声明会随响应下发给前端原样展示。
   * 必须把「这是天文近似，不是站点潮汐表」讲清楚，
   * 否则用户会拿大潮日期去对潮高，得出错误结论。
   */
  readonly disclaimer =
    '本结果由月相推算，只给出朔望大潮与方照小潮的日期窗口，不含站点潮高与具体潮时。' +
    '实际潮汐还受海底地形、水深与气象（气压、风）影响，且大潮实际出现时间通常比朔望滞后 1 至 2 天（潮龄效应）。' +
    '海钓请以当地海洋预报机构发布的潮汐表为准。'

  async fetchTide(params: FetchTideParams): Promise<TidePrediction> {
    const { point, date, isCoastal } = params

    return {
      provider: this.kind,
      providerName: this.name,
      precision: this.precision,
      disclaimer: this.disclaimer,
      date,
      isCoastal,
      windows: buildTideWindows({ date, timeZone: point.timezone, spanDays: 3 }),
      // 站点级潮高与潮时需要第三方数据源，天文近似无法给出。
      // 保持为空数组，而不是用一个模型凑出看似精确的数值。
      extremes: [],
      hourlyHeights: [],
    }
  }
}
