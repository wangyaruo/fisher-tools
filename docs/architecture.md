# 架构说明

## 分层与依赖方向

```
apps/web (Vue 3)  ──┐
                    ├──> packages/shared ──> astronomy-engine / zod
apps/api (Fastify) ─┘
```

依赖方向严格单向：`shared` 不感知任何一端，`api` 与 `web` 各自依赖 `shared`。

`shared` 承载三类内容：

1. **Zod Schema** —— 数据契约的唯一来源
2. **天文算法** —— 月相、日月出没、solunar 时段
3. **评分核心** —— 钓鱼指数因子权重与计分

放在 `shared` 而不是各端各写一份，是因为这些逻辑一旦分叉，前端展示的
「50 分为中性」与后端计算的基线就可能不一致，而这类不一致极难被发现。

## 数据契约：Schema 即类型

所有跨端结构都由 Zod Schema 定义，TypeScript 类型由 `z.infer` 导出。

前端通过 `import type` 取类型：

```ts
import type { AstronomyBundle } from '@fisher-tools/shared/schemas'
```

**必须是 `import type`。** 若写成值导入，zod 与 astronomy-engine 会被打进
浏览器包——前端只需要类型，不需要这些运行时依赖。这类错误在体积上才暴露，
因此在代码评审中需要专门留意。

Schema 同时承担运行期校验：上游数据结构与预期不符时抛 `ZodError`，
由错误处理器映射为 502 并列出具体不一致字段，而不是让脏数据流到前端。

## 一次 `/api/overview` 请求的链路

```
route (/api/overview)
  └─ fishing-index.service        ← 聚合入口
       ├─ forecast.service        ← 气象 + 海洋，并计算逐日昼夜温差
       ├─ astronomy.service       ← 调用 shared 的天文算法
       ├─ tide.service            ← 调用潮汐 provider
       └─ shared.scoreFishingIndex ← 纯函数，无 IO
```

总览做成单个聚合接口而不是让前端并发打四个接口：一次渲染需要的是
**同一时刻的同一份数据快照**。分开请求会在上游更新边界上出现
「气压来自 16:00、月相来自 17:00」的错配。

## 缓存与并发去重

`apps/api/src/cache.ts` 提供带 TTL 的内存缓存，关键能力是 `wrap()` 的同键去重：

```ts
const pending = this.inflight.get(key)
if (pending) return pending as Promise<T>
```

一次总览要同时打气象、海洋与天文三路上游；多个用户或连续刷新会在同一秒内
产生完全相同的上游请求。不去重的话上游很容易返回 429，而这是最容易避免的
一类故障。`/health` 会输出 `inflightDeduped` 计数，可直接观察去重是否生效。

缓存 TTL 由 `CACHE_TTL_SECONDS` 控制，默认 600 秒——气象数据是小时级更新，
600 秒足够且能显著降低上游压力。

缓存容量有上限（默认 500 条）：key 由坐标与时刻组合而成，不设上限时内存会随
「钓点 × 时刻」的组合单调增长。写入触发清理——先清过期条目，仍满则按插入序
淘汰最早写入的条目。

传输层另有两处配合：

- `@fastify/compress`：聚合响应体积在百 KB 级，gzip 后实测传输量约降 83%。
- 知识库 GET 响应带 `ETag` 与 `Cache-Control: public, max-age=300`：内容只随
  部署变化，浏览器过期后用 ETag 重验证，未变则 304。检索接口不缓存。

## 错误分类

`buildApp()` 中统一映射，避免每个路由各写一套：

| 错误类型 | 状态码 | 含义 |
| --- | --- | --- |
| `BadRequestError` | 400 | 请求参数不合法 |
| `UpstreamError` | 502 | 上游不可用或返回异常 |
| `ZodError` | 502 | 上游结构变更（响应校验失败） |
| 其他 | 500 | 未预期的服务端错误 |

把「上游结构变更」与「上游不可用」分开，是因为两者的处置方式不同：
前者要改代码，后者等一会儿重试即可。

## 时区处理

这是本项目最容易出错的地方，`packages/shared/src/utils/time.ts` 专门处理。

**统一口径**：接口返回的所有时刻字符串都是**钓点当地的墙上时间**
（`YYYY-MM-DDTHH:mm`），不含时区信息。前端据此展示，**不做任何二次换算**。

服务端把「当地墙上时间 + 时区名」转成 UTC 时刻时，用 `zonedTimeToUtc()`：

- 用 `hourCycle: 'h23'` 而非默认的 `hour12: false`——后者在午夜会返回 `"24"`，
  解析成 24 点会直接跨日。
- 做二次偏移校正，避免夏令时切换点上的漂移。

**已知边界**：若把深圳的坐标配上 UTC 时区，24 小时搜索窗会把日出日落取到
相邻的两天，算出负的昼长。因此 `sun.ts` 在 `sunset.date <= sunrise.date`
时直接抛错，并有一条专门的测试用例覆盖这个场景——静默返回负值是更坏的结果。

## 前端数据流

`stores/overview.ts` 用一个 Pinia store 承载 `/api/overview` 的响应，
总览、气象曲线、日月与潮汐三个页面共享这一份数据：

- 切页不重复往返。
- `watch([locationKey, at])` 触发重新加载，并用 `AbortController` 取消
  上一次未完成的请求——否则快速切换钓点时旧响应会覆盖新响应。
- 钓点状态持久化**预设 key、自定义钓点字段与查询时刻**，不持久化预设坐标快照：
  预设列表若调整坐标，旧快照会让用户看到过时数据。自定义钓点经
  `sanitizeCustomLocation()` 集中校验后才入库，持久化数据损坏时自动回落默认点。
- 数据有陈旧阈值（10 分钟）：页面回到前台且超过阈值时自动重取——
  总览是「某个时刻」的快照，页面挂在后台过夜后「此刻」早已改变。
- 知识库正文有前端缓存（slug → doc），内容只随部署变化，重复打开同一篇免往返。

允许指定「查询时刻」而不是只能看当前：出钓通常提前一天规划，
需要看的是明天清晨的窗口，而不是当前这一秒的条件。

## 图表实现要点

ECharts 按需注册（`lib/echarts.ts`），只引入折线、柱状与所需交互组件。

几个刻意的选择：

- **气压用站点气压（`surfacePressure`）而非海平面气压**——前者才是钓点
  实际承受的气压，跨海拔比较才用后者。
- **温差同时给两组数**：「日最高 − 日最低」与「白昼均值 − 夜间均值」，
  用于区分「白天热晚上凉」与「昼夜整体升降」两种不同情形。
- **因子用横向条形图而非雷达图**：雷达图能表现形状，但看不出谁在扣分；
  按加减分排序一眼就能回答「今天差在哪」。
- **时段轴用「同 stack 的透明占位条 + 实色时长条」拼区间**：ECharts 的
  bar 没有原生区间绘制能力，第一段承担左偏移、第二段承担长度。
  同一行有多个时段时不合并行，而是让每个时段各占一行，避免堆叠语义混乱。

图表容器用 `ResizeObserver` 而不是 `window.resize`：卡片在栅格中变宽时
窗口尺寸可能完全没变，只监听 window 会漏掉这类布局变化。

## 主题、深色模式与组件按需化

颜色只有一个来源：`styles/main.css` 里的 CSS token（`--ft-*`）。组件不写
硬编码 hex，因此主题切换只是「换一组变量值」：

- **深色模式**：跟随系统，`matchMedia('(prefers-color-scheme: dark)')` 切换
  根元素的 `dark` 类，`html.dark` 下的变量覆盖即时生效。玫瑰主色在暗底上
  提亮以保证对比度；Element Plus 官方暗色变量包同样挂在这个类下。
- **图表色板**：ECharts 无法消费 CSS 变量，色板中对明暗敏感的四色
  （轴线、网格线、底轨、夜间带）以 getter 在构建 option 时读取当前模式。
- **Element Plus 按需注册**：全站只用 13 个组件，`main.ts` 手动注册并逐个
  引入样式（每个样式入口自带依赖链）。相对全量引入，首屏 gzip 由 402KB 降至
  190KB。新增组件时注册与样式必须同步加。中文语言包由根部的
  `el-config-provider` 下发。
- **无障碍**：ECharts 经统一封装件注入 `aria`（文字描述 + 色弱纹理），
  全局 `:focus-visible` 焦点环，`prefers-reduced-motion` 时关闭路由过渡。

## 前端渲染验证

`curl` 只能确认 HTTP 200，无法发现运行期错误。项目的验证方式是用系统 Chrome
的无头模式经 DevTools 协议打开页面，采集：

- 控制台 error / warning 与未捕获异常
- 渲染后的可见文本（确认数据真的显示出来了）
- 各 `canvas` 的**像素颜色采样**——仅凭 canvas 元素存在无法判断内容是否
  真的画出，空白画布与有内容的画布在「不同颜色数」上差异极大
- 可选注入一段脚本做交互（例如模拟输入触发检索）

两个会反复踩到的环境坑：

1. **代理变量**：会话环境若设置了 `HTTP_PROXY` / `HTTPS_PROXY`，Chrome 会
   走该代理，访问 `localhost` 时被代理拒绝并报 `ERR_CONNECTION_REFUSED`。
   启动 Chrome 必须显式带 `--no-proxy-server`；`curl` 需要 `--noproxy '*'`。
   注意此时应用本身是健康的，报错页会误导排查方向。
2. **Vite 6 默认只监听 IPv6 回环**：`127.0.0.1:5173` 连不上，
   要用 `localhost` 或 `[::1]`。

2026-09 起又确认两条：

3. **企业安全代理按进程拦截浏览器流量**：部分办公网络环境下，所有浏览器
   （含无头 Chrome/Edge）的流量都会被重定向到企业登录页，`--no-proxy-server`
   与 `direct://` 均无效，而 `curl` 不受影响。此时上述浏览器验证不可用，
   退化为「逐模块编译 200 检查 + 使用者在自有浏览器确认」。
4. **Vite 端口被占会自动顺延**（5173 → 5174）：多项目同机开发时常见。
   验证前必须先确认 Vite 实际输出的端口——curl 错端口会打到别的项目，
   且对方同样返回 200，极具迷惑性。

排查顺序建议：先用 `curl --noproxy` 区分「服务没起来」与「浏览器侧问题」，
再取 `Page.navigate` 的返回值（含 `errorText`），最后才看控制台报错——
控制台里的 Vue Router 警告往往是导航失败的次生表现，不是根因。

## 提交与验证约定

- Conventional Commits，一个逻辑变更一个提交。
- 提交前跑 `pnpm typecheck`；测试全量 92 项（shared 30 + api 25 + web 37），
  改评分或天文算法时必须跑 `pnpm test`。
- GitHub Actions 在每次推送时自动执行 install、typecheck、test 与 build。
- 评分权重表改动前先看 `fishing-index.test.ts` 的基准用例，
  避免把相对关系调反。
- 知识库 Markdown 改动后必须用真实解析器（`loadKnowledgeDocs`）验证一次——
  类型检查测不出 frontmatter 解析失败，而一个坏文件会让知识库整页 500。
