/**
 * 「关于本站」页的内容数据。
 *
 * 与术语表同理：这些是内容而非逻辑，集中在一处便于修订，
 * 也便于将来改为从接口下发时只换数据来源。
 *
 * 事实口径以 docs/data-sources.md 为准，两处若不一致应以后者为准并同步修正这里。
 */

export interface DataSourceRow {
  /** 数据类别与所含要素 */
  item: string
  /** 提供方与接口 */
  provider: string
  /** 授权协议 */
  license: string
  /** 是否需要申请 API Key */
  needKey: boolean
  /** 补充说明，主要是降级与限制 */
  note?: string
}

export const DATA_SOURCES: DataSourceRow[] = [
  {
    item: '气象：气温、气压、风、云量、降水、湿度、能见度、紫外线',
    provider: 'Open-Meteo /v1/forecast',
    license: 'CC BY 4.0',
    needKey: false,
  },
  {
    item: '海洋：浪高、浪周期、浪向、海表水温',
    provider: 'Open-Meteo /v1/marine',
    license: 'CC BY 4.0',
    needKey: false,
    note: '内陆坐标上游会返回错误，这是预期情况而非故障，此时隐藏海洋面板并说明原因',
  },
  {
    item: '月相、日月出没、黄金时段、solunar 时段',
    provider: 'astronomy-engine 本地计算',
    license: 'MIT',
    needKey: false,
    note: '纯本地计算，不依赖网络',
  },
  {
    item: '潮汐窗口（大潮 / 中潮 / 小潮）',
    provider: '本地天文潮推算',
    license: '—',
    needKey: false,
    note: '只给窗口，不提供潮高与具体潮时',
  },
]

export interface PageGuide {
  label: string
  path: string
  /** 这一页回答什么问题 */
  question: string
  /** 页面上有什么 */
  content: string
}

export const PAGE_GUIDES: PageGuide[] = [
  {
    label: '垂钓总览',
    path: '/',
    question: '今天能不能去、大概几点去',
    content:
      '钓鱼指数与加减分拆解、当前气象条件、未来 48 小时气压趋势、日出日落与月相、日月活跃时段、潮汐窗口、当日昼夜温差、数据来源。首屏按「结论 → 依据」排列，先给判断再给理由。',
  },
  {
    label: '气象曲线',
    path: '/weather',
    question: '气象要素在一天里怎么变',
    content:
      '完整 72 小时的气压、气温与温差曲线，逐日汇总表，以及沿海点位才出现的海洋要素面板。曲线看趋势，表格查具体数值。',
  },
  {
    label: '日月与潮汐',
    path: '/astronomy',
    question: '天体的位置与时刻如何影响鱼口',
    content:
      '月相、月龄与照度、24 小时日月节律时间轴、日月出没与中天时刻、solunar 时段表、潮汐窗口表，以及本地计算结果与上游气象源的交叉验证记录。',
  },
  {
    label: '知识库',
    path: '/knowledge',
    question: '某个钓法或装备到底怎么回事',
    content:
      '7 个分类共 42 篇方法性文章，支持全文检索与分类筛选。讲的是机理与判断标准，不是口诀汇编。',
  },
  {
    label: '术语表',
    path: '/glossary',
    question: '钓友嘴里那个词是什么意思',
    content:
      '6 组共 119 条术语的速查表，含别称与关联词，可搜释义内容而不只是术语名。',
  },
  {
    label: '指数解读',
    path: '/scoring',
    question: '那个分数是怎么算出来的',
    content:
      '钓鱼指数 10 个因子的权重、每个因子的依据与最优区间、等级阈值、评分公式与自洽性说明。',
  },
]

export interface LimitItem {
  title: string
  detail: string
}

/**
 * 精度边界。
 *
 * 单独成块而不是塞进免责声明：这些不是法律措辞，而是使用者必须知道的
 * 「这个数字在什么情况下会不准」，直接决定结论能不能用。
 */
export const LIMITS: LimitItem[] = [
  {
    title: '气温只是水温的代理指标',
    detail:
      '拿不到海表水温时，模型用气温代替水温参与评分。浅水湖泊响应快，深水水库与海域的水温滞后可达数日。因此在内陆深水点位，温度因子的可信度明显低于沿海点位。',
  },
  {
    title: '潮汐只有天文潮近似，没有潮高与潮时',
    detail:
      '中国境内暂无稳定的免费站点级潮位接口，因此本站只判断大潮 / 中潮 / 小潮窗口，不给出潮高曲线与涨落潮时刻。真实潮汐是多个分潮的叠加，且存在 1–2 天的潮龄滞后，还受海底地形与气象影响。海钓请以当地海洋预报机构的潮汐表为准。',
  },
  {
    title: 'solunar 是经验假说，不是定理',
    detail:
      '日月活跃时段来自 John Alden Knight 于 1926 年提出的假说，流传极广但缺乏严格的对照实验支持。接口随结果一并返回其方法说明，页面上也原样展示，不包装成确定性结论。',
  },
  {
    title: '钓鱼指数是启发式模型',
    detail:
      '10 个因子按权重加权得到的是一个「相对提示」，不是出钓保证。不同水体与水层的响应差异显著，建议结合本地钓场经验校正权重，而不是照分数决定去不去。',
  },
  {
    title: '知识库不提供法规条文',
    detail:
      '各地禁渔规定差异大且逐年调整，写死就是错误信息。知识库只给制度框架与核查路径，具体时间与范围必须到当地渔政或农业农村部门的官方渠道确认当日有效版本。',
  },
  {
    title: '缺失数据不参与评分，而不是按 0 分处理',
    detail:
      '某个因子所需数据缺失时，该因子被标记为「降级」并排出权重计算，剩余因子按比例归一化。这样做的代价是分数由更少的因子决定，但避免把「没有数据」误报成「条件很差」。页面上可以区分二者。',
  },
]

export interface VerificationRecord {
  item: string
  method: string
  result: string
}

export const VERIFICATIONS: VerificationRecord[] = [
  {
    item: '日出日落时刻',
    method: '本地 astronomy-engine 计算值 vs Open-Meteo 逐日 sunrise / sunset 字段',
    result: '2026-09-10 深圳：两套独立来源均为 06:08 / 18:32，完全一致',
  },
  {
    item: '潮汐窗口与月相的自洽性',
    method: '窗口中心日期 vs 当月月龄',
    result: '窗口 09-08 至 09-13 以 09-11 新月为中心，与月龄 28.43 天自洽',
  },
  {
    item: '钓鱼指数加减分的自洽性',
    method: '所有因子 contribution 求和 vs 总分减 50',
    result: 'Σ contribution ≡ 总分 − 50，由单元测试保证，界面上的加减分与总分不会互相矛盾',
  },
]

export const DISCLAIMERS: string[] = [
  '钓鱼指数是基于公开气象与天文数据计算的相对提示，不构成出钓保证，也不构成任何形式的建议或承诺。',
  '潮汐为天文潮近似，不含站点潮高与具体潮时，海钓请以当地海洋预报机构的潮汐表为准。',
  'solunar 时段属经验假说，不同水域表现差异较大，建议结合本地渔获记录自行校验。',
  '知识库不提供法规条文的时间与范围，各地规定差异大且会调整，必须到官方渠道确认当日有效版本。',
  '气象与海洋数据来自第三方公开接口，本站不对其准确性与可用性作保证；数据可能延迟、缺失或中断。',
  '户外活动存在固有风险，请自行评估天气、水情与场地安全，安全须知类内容不构成专业指导。',
]
