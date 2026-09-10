import type { TideWindow, TideWindowKind } from '@fisher-tools/shared'
import { moonPhaseAt, round, zonedTimeToUtc } from '@fisher-tools/shared'

/**
 * 朔望潮强度，取 |cos(2π·相位)|。
 * 相位 0（新月）与 0.5（满月）时取 1，对应日月引潮力叠加的大潮；
 * 相位 0.25 与 0.75（上下弦）时取 0，对应引潮力相互抵消的小潮。
 *
 * 注意：这是朔望周期的基频分量，属简化的天文近似。真实潮汐是多个分潮
 * （M2、S2、K1、O1 等）的叠加，因此本函数只用于判断「大潮窗口 / 小潮窗口」，
 * 不能用于推算潮高与具体潮时。
 */
export function springTideStrength(phase: number): number {
  return Math.abs(Math.cos(2 * Math.PI * phase))
}

/** 按强度分档：≥0.75 为大潮，≤0.25 为小潮，其余为中潮。 */
export function classifyTideDay(strength: number): TideWindowKind {
  if (strength >= 0.75) return 'spring'
  if (strength <= 0.25) return 'neap'
  return 'mid'
}

const WINDOW_LABELS: Record<TideWindowKind, string> = {
  spring: '朔望大潮窗口，潮差较大、潮流交换强',
  mid: '中潮窗口，潮差中等',
  neap: '方照小潮窗口，潮差较小、水体交换弱',
}

/** 按 UTC 日期加减天数，避开本地时区解析带来的跨日漂移。 */
export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year!, month! - 1, day!) + days * 86_400_000)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DaySample {
  date: string
  kind: TideWindowKind
  illuminatedFraction: number
}

function sampleDays(date: string, timeZone: string, spanDays: number): DaySample[] {
  const samples: DaySample[] = []
  for (let offset = -spanDays; offset <= spanDays; offset += 1) {
    const day = shiftDate(date, offset)
    // 取当地正午为采样点，避开跨日边界
    const phase = moonPhaseAt(zonedTimeToUtc(`${day}T12:00`, timeZone))
    samples.push({
      date: day,
      kind: classifyTideDay(springTideStrength(phase.phase)),
      illuminatedFraction: phase.illuminatedFraction,
    })
  }
  return samples
}

export interface BuildTideWindowsParams {
  /** 中心日期 YYYY-MM-DD */
  date: string
  timeZone: string
  /** 中心日期前后各延伸的天数，默认 3（即共 7 天） */
  spanDays?: number
}

/**
 * 生成中心日期前后的大潮/小潮/中潮窗口，并合并连续的同类型日期。
 * 之所以给出一段窗口而非单日：朔望前后数天的潮差都明显偏大，
 * 实际出钓需要的是一个可安排的日期区间。
 */
export function buildTideWindows(params: BuildTideWindowsParams): TideWindow[] {
  const { date, timeZone, spanDays = 3 } = params
  const days = sampleDays(date, timeZone, spanDays)

  const groups: Array<{ kind: TideWindowKind; days: DaySample[] }> = []
  for (const day of days) {
    const last = groups[groups.length - 1]
    if (last && last.kind === day.kind) {
      last.days.push(day)
    } else {
      groups.push({ kind: day.kind, days: [day] })
    }
  }

  return groups.map((group) => {
    const first = group.days[0]!
    const last = group.days[group.days.length - 1]!
    const meanFraction =
      group.days.reduce((acc, day) => acc + day.illuminatedFraction, 0) / group.days.length
    return {
      kind: group.kind,
      label: WINDOW_LABELS[group.kind],
      start: `${first.date}T00:00`,
      end: `${last.date}T23:59`,
      illuminatedFraction: round(meanFraction, 4),
    }
  })
}
