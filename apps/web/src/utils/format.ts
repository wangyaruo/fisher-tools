/** 把本地墙上时间字符串（YYYY-MM-DDTHH:mm）截取为 HH:mm */
export function hhmm(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /T(\d{2}:\d{2})/.exec(value)
  return match ? match[1]! : value
}

/** 截取为 MM-DD */
export function mmdd(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(5, 10)
}

/** 截取为 MM-DD HH:mm */
export function mmddhhmm(value: string | null | undefined): string {
  if (!value) return '—'
  return `${value.slice(5, 10)} ${hhmm(value)}`
}

export function number(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

/** 带正负号的数值，用于变压与温差这类有方向的量 */
export function signed(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const text = value.toFixed(digits)
  return value > 0 ? `+${text}` : text
}

const WIND_DIRECTIONS = [
  '北',
  '北东北',
  '东北',
  '东东北',
  '东',
  '东东南',
  '东南',
  '南东南',
  '南',
  '南西南',
  '西南',
  '西西南',
  '西',
  '西西北',
  '西北',
  '北西北',
] as const

/** 风向角度转中文方位（16 方位） */
export function windDirection(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return '—'
  const normalized = ((deg % 360) + 360) % 360
  const index = Math.round(normalized / 22.5) % 16
  return WIND_DIRECTIONS[index]!
}

/** 分钟数转「h 小时 m 分」 */
export function duration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return hours > 0 ? `${hours} 小时 ${rest} 分` : `${rest} 分`
}

/**
 * 把「当天内的本地墙上时间」转成自 00:00 起的分钟数。
 * 入参允许 `HH:mm` 或带日期的 `YYYY-MM-DDTHH:mm`——接口返回的时刻
 * 均为钓点当地时间，因此不涉及任何时区换算。
 */
export function minutesOfDay(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** 分钟数转 `HH:mm`，超过 24 小时按 24 小时取模 */
export function minutesToHhmm(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hours = Math.floor(wrapped / 60)
  const rest = wrapped % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

/** 照度比例转百分比文本 */
export function percent(fraction: number | null | undefined, digits = 0): string {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}

const GRADE_CLASS: Record<string, string> = {
  excellent: 'is-excellent',
  good: 'is-good',
  fair: 'is-fair',
  poor: 'is-poor',
  bad: 'is-bad',
}

export function gradeClass(grade: string): string {
  return GRADE_CLASS[grade] ?? 'is-fair'
}
