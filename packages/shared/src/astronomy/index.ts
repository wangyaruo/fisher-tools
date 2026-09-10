import type { AstronomyBundle } from '../schemas'
import { computeMoonInfo } from './moon'
import { computeSolunar } from './solunar'
import { computeSunTimes } from './sun'

export * from './moon'
export * from './sun'
export * from './solunar'

export interface ComputeAstronomyParams {
  /** 本地日期，YYYY-MM-DD */
  date: string
  timeZone: string
  latitude: number
  longitude: number
  /** 计算月相与月亮高度角的时刻，默认该日中午 */
  at?: Date
}

/** 一次性产出前端所需的全部天文数据。 */
export function computeAstronomyBundle(params: ComputeAstronomyParams): AstronomyBundle {
  const moon = computeMoonInfo(params)
  return {
    date: params.date,
    timezone: params.timeZone,
    moon,
    sun: computeSunTimes(params),
    solunar: computeSolunar({ moon }),
  }
}
