import type { AstronomyBundle, Forecast } from '../schemas'

interface TimeZoneParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

/**
 * 按指定 IANA 时区拆分时刻。
 * 统一使用 hourCycle h23，否则部分 ICU 版本在午夜会返回 "24" 导致解析出次日。
 */
function partsInTimeZone(date: Date, timeZone: string): TimeZoneParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(date)
  const pick = (type: string, fallback: string): string =>
    parts.find((p) => p.type === type)?.value ?? fallback
  return {
    year: pick('year', '1970'),
    month: pick('month', '01'),
    day: pick('day', '01'),
    hour: pick('hour', '00'),
    minute: pick('minute', '00'),
    second: pick('second', '00'),
  }
}

/** 该时区在给定时刻相对 UTC 的偏移毫秒数（东八区为 +8h）。 */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = partsInTimeZone(date, timeZone)
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  )
  return asUtc - date.getTime()
}

const LOCAL_ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/

/** 把「本地墙上时间」字符串按给定时区解释为绝对时刻。 */
export function zonedTimeToUtc(localIso: string, timeZone: string): Date {
  const m = LOCAL_ISO_PATTERN.exec(localIso)
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(localIso)
  if (!m) return new Date(localIso)
  if (hasExplicitZone) return new Date(localIso)
  const [, y, mo, d, h, mi, s] = m
  const naiveUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? '0'),
  )
  // 夏令时切换边界处偏移会跳变，做一次迭代校正
  const firstPass = naiveUtc - zoneOffsetMs(new Date(naiveUtc), timeZone)
  const secondPass = naiveUtc - zoneOffsetMs(new Date(firstPass), timeZone)
  return new Date(secondPass)
}

/** 格式化为 YYYY-MM-DDTHH:mm（该时区的墙上时间）。 */
export function formatLocalDateTime(date: Date, timeZone: string): string {
  const p = partsInTimeZone(date, timeZone)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** 格式化为 YYYY-MM-DD。 */
export function formatLocalDate(date: Date, timeZone: string): string {
  const p = partsInTimeZone(date, timeZone)
  return `${p.year}-${p.month}-${p.day}`
}

/** 格式化为 HH:mm。 */
export function formatLocalTime(date: Date, timeZone: string): string {
  const p = partsInTimeZone(date, timeZone)
  return `${p.hour}:${p.minute}`
}

/** 该时区下的小时数，0-23。 */
export function localHour(date: Date, timeZone: string): number {
  return Number(partsInTimeZone(date, timeZone).hour)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function minutesBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 60_000
}

/** 判断目标时刻是否落在 [start, end] 区间内（闭区间，容差 1 分钟）。 */
export function isWithin(date: Date, startIso: string, endIso: string, timeZone: string): boolean {
  const start = zonedTimeToUtc(startIso, timeZone).getTime()
  const end = zonedTimeToUtc(endIso, timeZone).getTime()
  const t = date.getTime()
  return t >= start - 60_000 && t <= end + 60_000
}

/** 从「HH:mm」取出小时数，用于时段展示。 */
export function hourOfLocalTime(value: string): number {
  const m = /(\d{2}):(\d{2})/.exec(value)
  return m ? Number(m[1]) : 0
}

/**
 * 在逐小时序列中定位最接近目标时刻的一条。
 * 逐小时数据以本地整点为刻度，直接按时间字符串前缀匹配即可。
 */
export function pickHourlyAt<T extends { time: string }>(
  series: readonly T[],
  at: Date,
  timeZone: string,
): T | null {
  const targetHour = formatLocalDateTime(at, timeZone).slice(0, 13)
  const exact = series.find((p) => p.time.slice(0, 13) === targetHour)
  if (exact) return exact
  return series[0] ?? null
}

/** 按日期前缀筛出某一天的逐小时数据。 */
export function filterByLocalDate<T extends { time: string }>(
  series: readonly T[],
  date: string,
): T[] {
  return series.filter((p) => p.time.slice(0, 10) === date)
}
