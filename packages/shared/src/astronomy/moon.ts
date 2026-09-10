import * as Astronomy from 'astronomy-engine'
import type { MoonInfo, MoonPhaseName } from '../schemas'
import { clamp, round } from '../utils/number'
import { formatLocalDateTime, zonedTimeToUtc } from '../utils/time'

const AU_TO_KM = 149_597_870.7
const DAY_MS = 86_400_000
const SYNODIC_MONTH_DAYS = 29.530588853

const PHASE_NAME_TABLE: ReadonlyArray<{ max: number; name: MoonPhaseName; zh: string }> = [
  { max: 0.02, name: 'new_moon', zh: '新月' },
  { max: 0.22, name: 'waxing_crescent', zh: '娥眉月' },
  { max: 0.28, name: 'first_quarter', zh: '上弦月' },
  { max: 0.47, name: 'waxing_gibbous', zh: '盈凸月' },
  { max: 0.53, name: 'full_moon', zh: '满月' },
  { max: 0.72, name: 'waning_gibbous', zh: '亏凸月' },
  { max: 0.78, name: 'last_quarter', zh: '下弦月' },
  { max: 1.01, name: 'waning_crescent', zh: '残月' },
]

/** 由相位值（0-1）判定八分月相名称。 */
export function moonPhaseName(phase: number): { name: MoonPhaseName; zh: string } {
  const normalized = ((phase % 1) + 1) % 1
  const hit = PHASE_NAME_TABLE.find((entry) => normalized < entry.max) ?? PHASE_NAME_TABLE[0]!
  return { name: hit.name, zh: hit.zh }
}

/**
 * 由月面照度推算当日日月活跃度（0-100 区间中的 40-95）。
 *
 * 依据：朔望（新月与满月）时月球引潮力与太阳引潮力叠加，潮差最大，
 * 夜行性鱼种摄食活跃；上下弦（方照）时两者相互抵消，是公认的弱时段。
 * 因此取「接近新月」与「接近满月」两者的较大值，而非简单的照度高低。
 */
export function moonActivityFromIllumination(illuminatedFraction: number): number {
  const frac = clamp(illuminatedFraction, 0, 1)
  const newMoonProximity = clamp(1 - Math.min(frac, 1 - frac) / 0.25, 0, 1)
  const fullMoonProximity = clamp(1 - Math.abs(frac - 0.5) / 0.25, 0, 1)
  return 40 + 55 * Math.max(newMoonProximity, fullMoonProximity)
}

function toIsoOrNull(time: Astronomy.AstroTime | null, timeZone: string): string | null {
  return time ? formatLocalDateTime(time.date, timeZone) : null
}

/** 回溯定位上一次新月时刻，用于推算月龄。 */
function previousNewMoon(date: Date): Date {
  const start = new Date(date.getTime() - 32 * DAY_MS)
  const found = Astronomy.SearchMoonPhase(0, start, 32)
  if (!found) {
    // 理论上不会走到这里；若发生则退化为按朔望月长度取模估算
    return new Date(date.getTime() - ((date.getTime() / DAY_MS) % SYNODIC_MONTH_DAYS) * DAY_MS)
  }
  return found.date
}

/**
 * 只取相位与照度，不做任何升落搜索。
 * 适用于需要按天批量扫描相位的场景（例如推算大潮小潮窗口），
 * 比完整调用 computeMoonInfo 少做 5 次天文搜索。
 */
export function moonPhaseAt(at: Date): { phase: number; illuminatedFraction: number } {
  const phaseLon = Astronomy.MoonPhase(at)
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, at)
  return {
    phase: round((((phaseLon / 360) % 1) + 1) % 1, 4),
    illuminatedFraction: round(clamp(illumination.phase_fraction, 0, 1), 4),
  }
}

export interface ComputeMoonParams {
  /** 本地日期，YYYY-MM-DD */
  date: string
  timeZone: string
  latitude: number
  longitude: number
  /** 计算月亮高度角与相位的时刻，默认为该日中午 */
  at?: Date
}

/**
 * 计算指定日期与地点的月相与月亮出没时刻。
 *
 * 说明：一个农历月里通常有一天没有月出、一天没有月落（月亮每日推迟约 50 分钟），
 * 因此 moonrise / moonset 为 null 属正常结果而非计算失败，Schema 中已声明可空。
 */
export function computeMoonInfo(params: ComputeMoonParams): MoonInfo {
  const { date, timeZone, latitude, longitude } = params
  const at = params.at ?? zonedTimeToUtc(`${date}T12:00`, timeZone)
  const observer = new Astronomy.Observer(latitude, longitude, 0)

  const phaseLon = Astronomy.MoonPhase(at)
  const phase = phaseLon / 360
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, at)
  const { name, zh } = moonPhaseName(phase)

  const ageDays = (at.getTime() - previousNewMoon(at).getTime()) / DAY_MS

  const dayStart = zonedTimeToUtc(`${date}T00:00`, timeZone)
  const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, 1, dayStart, 1)
  const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, dayStart, 1)

  // 月中天（上中天，时角 0）与月下中天（下中天，时角 12）是 solunar 主要时段的依据
  let transit: Astronomy.AstroTime | null = null
  let underfoot: Astronomy.AstroTime | null = null
  try {
    transit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, dayStart, 1).time
    underfoot = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 12, dayStart, 1).time
  } catch {
    // 极区或极端地理位置下可能无解，保持 null 并由上层降级展示
    transit = null
    underfoot = null
  }

  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, at, observer, true, true)
  const horizontal = Astronomy.Horizon(at, observer, equatorial.ra, equatorial.dec, 'normal')

  return {
    phase: round(((phase % 1) + 1) % 1, 4),
    illuminatedFraction: round(clamp(illumination.phase_fraction, 0, 1), 4),
    age: round(((ageDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS, 2),
    phaseName: name,
    phaseNameZh: zh,
    distance: Math.round(illumination.geo_dist * AU_TO_KM),
    moonrise: toIsoOrNull(moonrise, timeZone),
    moonset: toIsoOrNull(moonset, timeZone),
    transit: toIsoOrNull(transit, timeZone),
    underfoot: toIsoOrNull(underfoot, timeZone),
    altitude: round(horizontal.altitude, 1),
  }
}
