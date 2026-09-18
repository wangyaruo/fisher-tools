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
  positive: '#c14f74',
  negative: '#5f7f95',
  neutral: '#978a83',
  /** 时段轴：太阳相关 */
  sun: '#c07a1f',
  /** 时段轴：solunar 日月时段 */
  solunar: '#9a6fc0',
  /** 时段轴：潮汐窗口 */
  tide: '#5b6ab0',
  /** 时段轴：推荐出钓窗口（主题玫瑰色，作为视觉主角） */
  best: '#c14f74',
  /*
   * 以下四色在暗底上会刺眼或消失，需随主题切换。
   * 用 getter 在「构建 option 时」读取当前模式：模块加载时不求值，
   * 系统主题在应用存活期间切换时，下一次重建 option 即可拿到新色。
   */
  get night(): string {
    return isDark() ? 'rgba(212, 105, 142, 0.12)' : 'rgba(193, 79, 116, 0.06)'
  },
  get axis(): string {
    return isDark() ? '#8d7a80' : '#a99b95'
  },
  get split(): string {
    return isDark() ? '#3a2e32' : '#f3e6e1'
  },
  /** 时段轴底轨 */
  get track(): string {
    return isDark() ? '#3a2e32' : '#f6ebe7'
  },
}

/** 与 main.ts 的暗色切换保持同一信源：根元素的 dark 类 */
function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export { echarts }
