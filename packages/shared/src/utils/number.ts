/** 数值工具。数组取值一律做空值防护，与 noUncheckedIndexedAccess 保持一致。 */

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** 求均值。空数组返回 null，避免把「无数据」伪装成 0。 */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

export function sum(values: readonly number[]): number {
  let total = 0
  for (const v of values) total += v
  return total
}

/**
 * 分段线性插值。
 * 用于把连续的观测值映射到 0-100 的因子得分，
 * 相比硬阈值分档可以避免相邻取值得分跳变。
 */
export function piecewise(
  value: number,
  points: ReadonlyArray<readonly [number, number]>,
): number {
  if (points.length === 0) return 50
  const first = points[0]!
  const last = points[points.length - 1]!
  if (value <= first[0]) return first[1]
  if (value >= last[0]) return last[1]
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!
    const b = points[i + 1]!
    if (value >= a[0] && value <= b[0]) {
      const span = b[0] - a[0]
      if (span === 0) return b[1]
      const ratio = (value - a[0]) / span
      return a[1] + ratio * (b[1] - a[1])
    }
  }
  return last[1]
}
