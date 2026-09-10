import { BarChart, LineChart } from 'echarts/charts'
import {
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
>

/** 图表统一色板，与全局样式里的语义色保持一致 */
export const CHART_COLORS = {
  pressure: '#185FA5',
  temperature: '#BA7517',
  apparent: '#888780',
  night: 'rgba(24, 95, 165, 0.07)',
  positive: '#0F6E56',
  negative: '#B02020',
  neutral: '#888780',
  axis: '#8a9aa0',
  split: '#e8eeee',
  /** 时段轴：太阳相关 */
  sun: '#BA7517',
  /** 时段轴：solunar 日月时段 */
  solunar: '#0F6E56',
  /** 时段轴：潮汐窗口 */
  tide: '#5B54A6',
  /** 时段轴：推荐出钓窗口 */
  best: '#185FA5',
  /** 时段轴底轨 */
  track: '#eef3f3',
} as const

export { echarts }
