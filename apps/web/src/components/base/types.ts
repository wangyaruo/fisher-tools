/**
 * 基础展示组件的数据结构。
 *
 * 单独放在 .ts 里而不是写进 SFC，是为了让调用方（各面板组件）能直接
 * import 这个类型来标注自己的 computed，避免每个面板各写一份结构相同的
 * 匿名类型、后续改字段时漏改某一处。
 */

/** KeyValueList 的一行 */
export interface KeyValueItem {
  /** 左侧名称 */
  label: string
  /** 右侧取值；为 null / undefined / 空串时渲染为「—」 */
  value?: string | number | null
  /** 取值后紧跟的淡化说明，例如「（地面以上）」 */
  hint?: string
}

/** FigureRow 的一项 */
export interface FigureItem {
  /** 前置说明，例如「3 小时」 */
  label: string
  /** 加粗展示的数值 */
  value: string | number
  /** 数值后的单位，例如「hPa」 */
  unit?: string
}
