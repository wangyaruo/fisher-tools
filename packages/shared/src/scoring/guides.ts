/**
 * 评分模型的「内容层」出口。
 *
 * 存在的理由是包体积：`./scoring` 这个入口一并导出了 fishing-index.ts，
 * 而它依赖 astronomy-engine。前端只需要权重、标签与解读文案这些纯常量，
 * 若从 `./scoring` 引入，会把整套天文计算打进浏览器包 ——
 * 这正是项目里「前端取类型必须 import type」那条约束要防的同一类问题。
 *
 * 本模块的运行时依赖只有 weights.ts 与 factor-guides.ts，两者都只以
 * `import type` 引用 schemas，编译后不产生任何运行时导入，因此不会带入 zod。
 */
export { FACTOR_LABELS, FACTOR_WEIGHTS, NEUTRAL_SCORE, WEIGHT_SUM_TOLERANCE } from './weights'
export { FACTOR_COUNT, FACTOR_GUIDES, GRADE_THRESHOLDS } from './factor-guides'
export type { FactorGuide } from './factor-guides'
