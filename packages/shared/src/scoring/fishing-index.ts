import type {
  DiurnalRangePoint,
  FactorDirection,
  FishingGrade,
  FishingIndex,
  FishingIndexInputs,
  HourlyWeatherPoint,
  MarineHourlyPoint,
  MoonInfo,
  PressureTrend,
  ScoreFactor,
  Solunar,
  SunTimes,
  TideWindowKind,
} from '../schemas'
import { clamp, piecewise, round, sum } from '../utils/number'
import { formatLocalDateTime, isWithin } from '../utils/time'
import { moonActivityFromIllumination } from '../astronomy/moon'
import { FACTOR_LABELS, FACTOR_WEIGHTS, NEUTRAL_SCORE } from './weights'

interface FactorResult {
  rawScore: number
  detail: string
  degraded: boolean
}

export interface ScoreFishingIndexParams {
  /** 评分针对的时刻。逐小时预报与日月时段都会按该时刻对齐 */
  at: Date
  timeZone: string
  location: { latitude: number; longitude: number }
  weather: HourlyWeatherPoint | null
  pressureTrend?: PressureTrend | null
  diurnalRange?: DiurnalRangePoint | null
  marine?: MarineHourlyPoint | null
  moon?: MoonInfo | null
  solunar?: Solunar | null
  sun?: SunTimes | null
  tideWindowKind?: TideWindowKind | null
}

const MISSING = (what: string): FactorResult => ({
  rawScore: NEUTRAL_SCORE,
  detail: `缺少${what}数据，本项按中性处理且不占权重`,
  degraded: true,
})

/**
 * 气压趋势（3 小时变压）。
 * 依据：气压缓慢下降时鱼类为应对天气变化而加大摄食，是公认的最佳窗口；
 * 气压快速回升后鱼群普遍下沉、开口变差。
 */
function scorePressureTrend(trend: PressureTrend | null | undefined): FactorResult {
  const delta = trend?.delta3h ?? null
  if (delta === null) return MISSING('气压趋势')
  const rawScore = piecewise(delta, [
    [-6, 40],
    [-3, 55],
    [-1.5, 88],
    [-0.5, 95],
    [0, 78],
    [0.5, 72],
    [1.5, 60],
    [3, 42],
    [6, 30],
  ])
  const sign = delta > 0 ? '+' : ''
  return {
    rawScore,
    detail: `近 3 小时变压 ${sign}${round(delta, 1)} hPa，判定为「${trend?.tendencyLabel ?? '未知'}」`,
    degraded: false,
  }
}

/**
 * 气压绝对水平。
 * 依据：1010-1018 hPa 区间鱼类最舒适；过低则溶氧不足，过高则鱼多沉底。
 * 注意此处使用站点气压而非海平面气压，前者才反映钓点实际溶氧条件。
 */
function scorePressureLevel(weather: HourlyWeatherPoint | null): FactorResult {
  const pressure = weather?.surfacePressure ?? null
  if (pressure === null) return MISSING('气压')
  const rawScore = piecewise(pressure, [
    [960, 45],
    [995, 62],
    [1005, 78],
    [1013, 88],
    [1020, 80],
    [1030, 62],
    [1045, 45],
  ])
  return { rawScore, detail: `站点气压 ${round(pressure, 1)} hPa`, degraded: false }
}

/**
 * 水温或气温。有海表水温时优先使用，它比气温更接近鱼类实际所处环境。
 * 依据：多数常见淡水鱼种在 15-25°C 区间摄食最积极，低于 8°C 或高于 30°C 明显减弱。
 */
function scoreTemperature(
  weather: HourlyWeatherPoint | null,
  marine: MarineHourlyPoint | null | undefined,
): FactorResult {
  const seaTemperature = marine?.seaSurfaceTemperature ?? null
  const value = seaTemperature ?? weather?.temperature ?? null
  if (value === null) return MISSING('气温/水温')
  const rawScore = piecewise(value, [
    [-5, 15],
    [2, 32],
    [8, 52],
    [15, 82],
    [20, 92],
    [26, 86],
    [30, 62],
    [35, 35],
    [40, 20],
  ])
  const label = seaTemperature !== null ? '海表水温' : '气温（水温代理）'
  return { rawScore, detail: `${label} ${round(value, 1)} °C`, degraded: false }
}

/**
 * 昼夜温差。
 * 依据：温差小意味着水温垂直分层弱、变温层稳定，鱼类不需频繁调节水层，开口更稳。
 */
function scoreDiurnalRange(range: DiurnalRangePoint | null | undefined): FactorResult {
  const value = range?.range ?? null
  if (value === null) return MISSING('昼夜温差')
  const rawScore = piecewise(value, [
    [2, 92],
    [5, 88],
    [8, 72],
    [12, 55],
    [16, 38],
    [22, 25],
  ])
  return {
    rawScore,
    detail: `当日温差 ${round(value, 1)} °C（最高 ${round(range?.max ?? 0, 1)} / 最低 ${round(range?.min ?? 0, 1)}）`,
    degraded: false,
  }
}

/**
 * 风力。
 * 依据：5-12 km/h 微风吹拂可增加表层溶氧并形成饵料带，属最有利区间；
 * 无风时水体交换弱，超过 25 km/h 后抛投与观漂均困难。
 */
function scoreWind(weather: HourlyWeatherPoint | null): FactorResult {
  const wind = weather?.windSpeed ?? null
  if (wind === null) return MISSING('风力')
  const rawScore = piecewise(wind, [
    [0, 62],
    [2, 78],
    [5, 90],
    [12, 92],
    [18, 72],
    [25, 48],
    [35, 25],
    [45, 12],
  ])
  return {
    rawScore,
    detail: `风速 ${round(wind, 1)} km/h，阵风 ${round(weather?.windGust ?? 0, 1)} km/h`,
    degraded: false,
  }
}

/**
 * 云量。
 * 依据：中等云量削弱强光、降低鱼类警戒，同时不至于让水温骤降；
 * 万里无云的强光天与厚重阴天均次之。
 */
function scoreCloudCover(weather: HourlyWeatherPoint | null): FactorResult {
  const cloud = weather?.cloudCover ?? null
  if (cloud === null) return MISSING('云量')
  const rawScore = piecewise(cloud, [
    [0, 55],
    [20, 68],
    [45, 90],
    [70, 88],
    [90, 78],
    [100, 72],
  ])
  return { rawScore, detail: `云量 ${round(cloud, 0)}%`, degraded: false }
}

/**
 * 月相盈亏。
 * 依据：朔望（新月与满月）时月球引潮力叠加，潮差最大、夜行性鱼种摄食活跃；
 * 上下弦（方照）时引潮力相互抵消，是公认的弱时段。
 * 打分函数本体见 astronomy/moon.ts 的 moonActivityFromIllumination。
 */
function scoreMoonPhase(moon: MoonInfo | null | undefined): FactorResult {
  if (!moon) return MISSING('月相')
  const rawScore = moonActivityFromIllumination(moon.illuminatedFraction)
  const phaseLabel = moon.illuminatedFraction >= 0.98 ? '满月' : moon.illuminatedFraction <= 0.02 ? '新月' : moon.phaseNameZh
  return {
    rawScore,
    detail: `${phaseLabel}，月龄 ${round(moon.age, 1)} 天，照度 ${round(moon.illuminatedFraction * 100, 0)}%`,
    degraded: false,
  }
}

/**
 * 日月时段（solunar）。
 * 依据：月中天与月下中天前后约一小时被称为主要时段，月出月落为次要时段。
 * 本项只评价「评分时刻」是否落在这些窗口内，属时间维度而非强度维度。
 */
function scoreSolunarTiming(
  at: Date,
  timeZone: string,
  solunar: Solunar | null | undefined,
): FactorResult {
  const periods = solunar?.periods ?? []
  if (periods.length === 0) return MISSING('日月时段')
  const hit = periods.find((p) => isWithin(at, p.start, p.end, timeZone))
  if (hit) {
    const rawScore = hit.type === 'major' ? 95 : 82
    return {
      rawScore,
      detail: `当前处于${hit.typeLabel}（${hit.basisLabel}），高峰 ${hit.peak.slice(11)}`,
      degraded: false,
    }
  }
  return {
    rawScore: 50,
    detail: '当前不在日月活跃窗口内，可等待主要时段',
    degraded: false,
  }
}

/**
 * 潮汐窗口。
 * 依据：朔望大潮期间潮流交换强，掠食性鱼种活跃度上升；
 * 方照小潮期间潮差小、水体交换弱。内陆钓点无此项，按缺失处理。
 */
function scoreTideWindow(kind: TideWindowKind | null | undefined): FactorResult {
  if (!kind) return MISSING('潮汐')
  const table: Record<TideWindowKind, { score: number; label: string }> = {
    spring: { score: 90, label: '朔望大潮' },
    mid: { score: 65, label: '中潮' },
    neap: { score: 42, label: '方照小潮' },
  }
  const entry = table[kind]
  return { rawScore: entry.score, detail: `当前处于${entry.label}窗口`, degraded: false }
}

/**
 * 降水。
 * 依据：零散小雨能增加表层溶氧并降低鱼的警戒，通常有利；
 * 持续中到大雨会搅浑水体、降低能见度，且伴随气压骤降，明显不利。
 */
function scorePrecipitation(weather: HourlyWeatherPoint | null): FactorResult {
  const rain = weather?.precipitation ?? null
  if (rain === null) return MISSING('降水')
  const rawScore = piecewise(rain, [
    [0, 72],
    [0.3, 88],
    [1.5, 80],
    [3, 62],
    [6, 42],
    [12, 22],
  ])
  return { rawScore, detail: `该小时降水 ${round(rain, 1)} mm`, degraded: false }
}

const GRADE_TABLE: ReadonlyArray<{ min: number; grade: FishingGrade; label: string }> = [
  { min: 80, grade: 'excellent', label: '极佳' },
  { min: 65, grade: 'good', label: '较好' },
  { min: 45, grade: 'fair', label: '一般' },
  { min: 30, grade: 'poor', label: '较差' },
  { min: 0, grade: 'bad', label: '很差' },
]

function gradeOf(score: number): { grade: FishingGrade; label: string } {
  const hit = GRADE_TABLE.find((g) => score >= g.min) ?? GRADE_TABLE[GRADE_TABLE.length - 1]!
  return { grade: hit.grade, label: hit.label }
}

function speciesHints(temperature: number | null, tideKind: TideWindowKind | null): string[] {
  const hints: string[] = []
  if (temperature !== null) {
    if (temperature < 10) hints.push('鲫鱼', '鳜鱼', '翘嘴')
    else if (temperature < 15) hints.push('鲫鱼', '鲤鱼', '鳜鱼')
    else if (temperature < 25) hints.push('鲫鱼', '鲤鱼', '草鱼', '鳊鱼')
    else if (temperature < 30) hints.push('草鱼', '鲤鱼', '罗非', '鲢鳙')
    else hints.push('罗非', '黑鱼', '鲢鳙')
  }
  if (tideKind === 'spring') hints.push('海鲈（沿海）', '鲷类（沿海）')
  return hints
}

/**
 * 计算钓鱼指数。
 *
 * 算法：所有因子按其权重加权平均得到总分；每个因子的 contribution
 * 定义为 `有效权重 × (因子得分 − 50)`，因此 Σ contribution = 总分 − 50，
 * 用户看到的加减分项与总分严格自洽，不存在「解释不通」的情况。
 *
 * 缺失数据的因子会被标记 degraded 并排出权重计算，剩余因子按比例放大权重，
 * 而不是把缺失值当 0 分处理——那会把「没数据」误报成「条件差」。
 */
export function scoreFishingIndex(params: ScoreFishingIndexParams): FishingIndex {
  const { at, timeZone, location, weather, pressureTrend, diurnalRange, marine, moon, solunar, tideWindowKind } =
    params

  const raw: Record<keyof typeof FACTOR_WEIGHTS, FactorResult> = {
    pressure_trend: scorePressureTrend(pressureTrend),
    pressure_level: scorePressureLevel(weather),
    temperature: scoreTemperature(weather, marine),
    diurnal_range: scoreDiurnalRange(diurnalRange),
    wind: scoreWind(weather),
    cloud_cover: scoreCloudCover(weather),
    moon_phase: scoreMoonPhase(moon),
    solunar_timing: scoreSolunarTiming(at, timeZone, solunar),
    tide_window: scoreTideWindow(tideWindowKind),
    precipitation: scorePrecipitation(weather),
  }

  const effectiveWeightSum = sum(
    (Object.keys(raw) as Array<keyof typeof raw>)
      .filter((key) => !raw[key].degraded)
      .map((key) => FACTOR_WEIGHTS[key]),
  )

  // 全部因子都缺失时退回中性分，避免出现 0 分或 NaN
  const normalizer = effectiveWeightSum > 0 ? effectiveWeightSum : 1

  const factors: ScoreFactor[] = (Object.keys(raw) as Array<keyof typeof raw>).map((key) => {
    const item = raw[key]
    const effectiveWeight = item.degraded ? 0 : FACTOR_WEIGHTS[key] / normalizer
    const contribution = item.degraded ? 0 : effectiveWeight * (item.rawScore - NEUTRAL_SCORE)
    const direction: FactorDirection =
      contribution > 0.5 ? 'positive' : contribution < -0.5 ? 'negative' : 'neutral'
    return {
      key,
      label: FACTOR_LABELS[key],
      weight: round(FACTOR_WEIGHTS[key], 4),
      rawScore: round(item.rawScore, 1),
      contribution: round(contribution, 2),
      direction,
      detail: item.detail,
      degraded: item.degraded,
    }
  })

  const score = round(clamp(NEUTRAL_SCORE + sum(factors.map((f) => f.contribution)), 0, 100), 1)
  const { grade, label } = gradeOf(score)

  const positives = factors
    .filter((f) => f.direction === 'positive')
    .sort((a, b) => b.contribution - a.contribution)
  const negatives = factors
    .filter((f) => f.direction === 'negative')
    .sort((a, b) => a.contribution - b.contribution)

  const bestHours = (solunar?.periods ?? [])
    .filter((p) => p.type === 'major')
    .map((p) => `${p.start.slice(11)}-${p.end.slice(11)}`)

  const degradedLabels = factors.filter((f) => f.degraded).map((f) => f.label)

  const caveats: string[] = [
    '本指数是基于公开气象与天文数据计算的相对提示，不构成出钓保证。',
    '气温仅作为水温代理指标。浅水湖泊响应快，深水水库与海域的水温滞后可达数日。',
    '不同水体与水层的响应差异显著，请结合本地钓场经验校正权重。',
    '潮汐为天文潮近似时不含站点潮高，仅用于判断大潮小潮窗口。',
  ]
  if (degradedLabels.length > 0) {
    caveats.push(
      `以下因子因缺少数据未参与评分，已按剩余权重归一化：${degradedLabels.join('、')}。`,
    )
  }

  const summaryParts: string[] = []
  summaryParts.push(`综合评分 ${score} 分（${label}）`)
  if (positives.length > 0) {
    summaryParts.push(`加分项：${positives.slice(0, 3).map((f) => f.label).join('、')}`)
  }
  if (negatives.length > 0) {
    summaryParts.push(`扣分项：${negatives.slice(0, 3).map((f) => f.label).join('、')}`)
  }

  const inputs: FishingIndexInputs = {
    at: formatLocalDateTime(at, timeZone),
    latitude: location.latitude,
    longitude: location.longitude,
    pressureHpa: weather?.surfacePressure ?? null,
    pressureDelta3h: pressureTrend?.delta3h ?? null,
    temperatureC: weather?.temperature ?? null,
    diurnalRangeC: diurnalRange?.range ?? null,
    windSpeedKmh: weather?.windSpeed ?? null,
    windDirectionDeg: weather?.windDirection ?? null,
    cloudCoverPct: weather?.cloudCover ?? null,
    precipitationMm: weather?.precipitation ?? null,
    moonIlluminatedFraction: moon?.illuminatedFraction ?? null,
    moonAgeDays: moon?.age ?? null,
    solunarScore: solunar?.score ?? null,
    tideWindowKind: tideWindowKind ?? null,
  }

  return {
    score,
    grade,
    gradeLabel: label,
    summary: `${summaryParts.join('；')}。`,
    positives,
    negatives,
    factors,
    bestHours,
    targetSpeciesHints: speciesHints(weather?.temperature ?? null, tideWindowKind ?? null),
    caveats,
    inputs,
    computedAt: formatLocalDateTime(new Date(), timeZone),
  }
}
