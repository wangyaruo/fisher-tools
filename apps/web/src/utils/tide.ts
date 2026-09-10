import type { TideWindowKind } from '@fisher-tools/shared/schemas'

/**
 * 潮汐窗口类型的中文名与标签色。
 *
 * 这套映射此前以嵌套三元表达式的形式散落在模板里 —— 同一处判断在两个页面
 * 各抄了一遍，标签色又抄了一遍，共 3 处。抄漏一个分支就会让某一类窗口
 * 显示错误文案，且不会有任何报错。集中一处后，新增窗口类型只需改这里。
 */
export const TIDE_KIND_LABELS: Record<TideWindowKind, string> = {
  spring: '大潮',
  neap: '小潮',
  mid: '中潮',
}

/** Element Plus 标签色：大潮最醒目，小潮最弱，与潮差的强弱对应 */
export const TIDE_KIND_TAG_TYPES: Record<
  TideWindowKind,
  'warning' | 'info' | 'success'
> = {
  spring: 'warning',
  neap: 'info',
  mid: 'success',
}
