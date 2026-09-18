import { BarChart, LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  AriaComponentOption,
  GridComponentOption,
  LegendComponentOption,
  MarkAreaComponentOption,
  MarkLineComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'

/**
 * 按需注册 ECharts 模块，而不是整包引入。
 * 整包约 1MB 且包含大量本项目用不到的地图与关系图，
 * 这里只注册折线、柱状与所需的交互组件。
 */
echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  AriaComponent,
  CanvasRenderer,
])

export type ChartOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | MarkAreaComponentOption
  | AriaComponentOption
>

/** 图表统一色板，与全局样式里的语义色保持一致（玫瑰暖色系） */
export const CHART_COLORS = {
  pressure: '#3d729e',
  temperature: '#c07a1f',
  apparent: '#978a83',
  night: 'rgba(193, 79, 116, 0.06)',
  positive: '#c14f74',
  negative: '#5f7f95',
  neutral: '#978a83',
  axis: '#a99b95',
  split: '#f3e6e1',
  /** 时段轴：太阳相关 */
  sun: '#c07a1f',
  /** 时段轴：solunar 日月时段 */
  solunar: '#9a6fc0',
  /** 时段轴：潮汐窗口 */
  tide: '#5b6ab0',
  /** 时段轴：推荐出钓窗口（主题玫瑰色，作为视觉主角） */
  best: '#c14f74',
  /** 时段轴底轨 */
  track: '#f6ebe7',
} as const

export { echarts }
