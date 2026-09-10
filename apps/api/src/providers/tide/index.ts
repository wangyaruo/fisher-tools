import { config } from '../../config.js'
import type { TideProvider } from './types.js'
import { AstronomicalTideProvider } from './astronomical.js'

/**
 * 当前启用天文潮近似。
 *
 * 未接入第三方站点级潮汐源的原因需要写明：中国境内没有稳定免费的
 * 公开潮位 API，随意接一个不可靠的源比不接更糟——用户会据此安排出钓。
 * 因此 .env 中的 TIDE_API_BASE_URL / TIDE_API_KEY 仅作占位，
 * 待确认可用数据源后，实现 TideProvider 接口（precision 置为
 * 'station_level' 并填充 extremes 与 hourlyHeights）即可切换。
 */
export function getTideProvider(): TideProvider {
  if (config.tide.enabled) {
    // 配置了第三方源但尚无对应实现时，明确记录而不是静默回退
    console.warn(
      '[tide] 检测到 TIDE_API_* 配置，但尚未实现站点级潮汐数据源，继续使用天文潮近似。' +
        '接入方式见 apps/api/src/providers/tide/types.ts 的说明。',
    )
  }
  return new AstronomicalTideProvider()
}

export { AstronomicalTideProvider }
export type { TideProvider }
