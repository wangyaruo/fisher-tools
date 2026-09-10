# 钓鱼助手（fisher-tools）

一个把「今天能不能去钓、几点出门、为什么」拆开讲清楚的垂钓辅助工具。

不做「鱼获保证」式的结论输出：所有评分与时段都给出计算依据、输入快照与局限性说明，
数字可以追溯到上游数据源。

## 功能

| 模块 | 内容 |
| --- | --- |
| 垂钓总览 | 钓鱼指数（含加减分明细）、站点气压趋势、日月时刻、月相与日月活跃度、潮汐窗口、昼夜温差、数据来源 |
| 气象曲线 | 72 小时站点气压曲线、气温与体感温度（夜间区间标注）、逐日昼夜温差、逐日明细表、海洋数据（浪高 / 浪周期 / 海表水温） |
| 日月与潮汐 | 月相可视化（按相位实算形状）、24 小时时段轴、太阳时刻、月亮时刻、日月活跃时段明细、潮汐窗口与精度声明 |
| 知识库 | 7 个分类、全文检索（标题权重 3 / 标签权重 2 / 正文权重 1）、命中片段高亮、Markdown 正文渲染 |

核心的「24 小时时段轴」把推荐出钓窗口、日月时段、黄金时段、民用晨昏与潮汐窗口
叠在同一条时间轴上，直接回答「几点出门」——分散成多张表时，用户必须自己在
脑子里做时间对齐。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus + ECharts（按需注册）
- **后端**：Node.js + Fastify + TypeScript + Zod
- **共享层**：`packages/shared` 同时被前后端引用，提供 Zod Schema、天文算法与钓鱼指数评分核心
- **包管理**：pnpm workspace

## 目录结构

```
apps/
  api/                  Fastify 服务
    src/providers/      上游数据源适配（Open-Meteo 气象 / 海洋、天文潮推算）
    src/services/       业务聚合（预报、天文、潮汐、钓鱼指数、知识库）
    src/routes/         HTTP 路由
    src/data/knowledge/ 知识库 Markdown 内容（随源码分发）
  web/                  Vue 3 应用
    src/components/     图表容器、指数卡、条件栅格、月相图形
    src/views/          四个页面
    src/stores/         钓点与总览数据
    src/utils/          格式化与图表构建函数
packages/
  shared/               前后端共用：Schema、天文算法、评分模型
docs/                   架构与数据源说明
```

## 快速开始

```bash
# 安装依赖（Node >= 20）
pnpm install

# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:api     # http://127.0.0.1:3001
pnpm dev:web     # http://localhost:5173
```

默认无需任何 API Key：气象数据来自 Open-Meteo 的免费接口。可选环境变量见 `.env.example`。

### 常用脚本

```bash
pnpm typecheck        # 全量类型检查（shared / api / web）
pnpm test             # 单元测试（评分模型与天文算法）
pnpm build            # 构建全部包
pnpm format           # Prettier 格式化
```

## 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查与缓存统计 |
| GET | `/api/forecast` | 逐小时气象与海洋预报、逐日汇总、昼夜温差 |
| GET | `/api/forecast/pressure-trend` | 指定时刻的气压趋势（1/3/6/12 小时变压） |
| GET | `/api/astronomy` | 月相、日月出没、solunar 时段 |
| GET | `/api/tide` | 朔望大潮 / 方照小潮窗口 |
| GET | `/api/fishing-index` | 钓鱼指数与因子明细 |
| GET | `/api/overview` | 上述内容的聚合响应（前端一次请求即可渲染总览） |
| GET | `/api/knowledge` | 知识库列表，支持 `category` 过滤 |
| GET | `/api/knowledge/search` | 全文检索，支持 `q` 与 `limit` |
| GET | `/api/knowledge/:slug` | 单篇文档（含 Markdown 正文） |

通用查询参数：`latitude`、`longitude`、`timezone`，部分接口额外支持 `at`（查询时刻）。

## 钓鱼指数模型

10 个因子加权求和，权重之和恒为 1：

| 因子 | 权重 | 因子 | 权重 |
| --- | --- | --- | --- |
| 气压趋势 | 0.20 | 降水 | 0.10 |
| 风力 | 0.15 | 昼夜温差 | 0.08 |
| 气温 | 0.10 | 云量 | 0.07 |
| 月相盈亏 | 0.10 | 气压水平 | 0.05 |
| 潮汐窗口 | 0.10 | 日月时段 | 0.05 |

计分口径：

- 因子原始分 50 为中性基线，`加减分 = 有效权重 × (原始分 − 50)`，因此
  `Σ加减分 ≡ 总分 − 50`，分数的每一分都能对应到具体因子。
- 各因子采用**分段线性插值**而非硬阈值分档，避免「差 0.1 就掉一档」的跳跃。
- 上游缺失某项数据时，该因子标记为 `degraded` 并按剩余因子归一化权重，
  而不是用默认值填充出一个看似完整的分数。

**这是启发式模型，不是水产学结论。** 评分仅作相对提示，不构成出钓保证。

## 数据源与免责声明

| 数据 | 来源 | 说明 |
| --- | --- | --- |
| 气象 / 海洋 | Open-Meteo | CC BY 4.0，无需 API Key |
| 天文计算 | astronomy-engine | 本地计算，无网络依赖 |
| 潮汐 | 本地天文潮推算 | **仅**给出朔望大潮与方照小潮的日期窗口 |

潮汐部分存在明确的精度边界：中国境内暂无稳定的免费站点级潮位接口，
因此当前实现只做天文潮近似，**不提供潮高与具体潮时**，`extremes` 与
`hourlyHeights` 恒为空数组。实际大潮出现时间通常比朔望滞后 1 至 2 天（潮龄效应），
海钓请以当地海洋预报机构发布的潮汐表为准。

知识库不提供法规条文的时间与范围，只给出核查方法——各地规定差异大且会调整，
必须到官方渠道确认当日有效版本。

## 开发约定

- 提交信息遵循 Conventional Commits，按「一个逻辑变更一个提交」拆分。
- 提交前至少跑通 `pnpm typecheck`；涉及评分或天文算法改动时跑 `pnpm test`。
- 评分权重表调整前先看 `packages/shared/src/scoring/fishing-index.test.ts` 的基准用例。

更多细节见 [`docs/architecture.md`](docs/architecture.md) 与
[`docs/data-sources.md`](docs/data-sources.md)。

## 许可

MIT
