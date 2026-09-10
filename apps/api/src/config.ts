import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

/**
 * 尝试加载 .env。
 * 依次查找包目录与仓库根目录；都不存在时不影响启动，
 * 因为默认的 Open-Meteo 数据源无需任何密钥。
 */
function loadDotEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ]
  const loadEnvFile = (process as unknown as { loadEnvFile?: (path: string) => void }).loadEnvFile
  if (typeof loadEnvFile !== 'function') return
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      loadEnvFile(candidate)
      return
    }
  }
}

loadDotEnv()

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('0.0.0.0'),
  OPEN_METEO_BASE_URL: z.string().url().default('https://api.open-meteo.com'),
  OPEN_METEO_MARINE_BASE_URL: z.string().url().default('https://marine-api.open-meteo.com'),
  /** 上游数据缓存时长。气象数据为小时级更新，600 秒足够且能显著降低上游压力 */
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  /** 留空表示使用天文潮近似，不接第三方站点级潮汐源 */
  TIDE_API_BASE_URL: z.string().default(''),
  TIDE_API_KEY: z.string().default(''),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  // 配置错误必须在启动时暴露，而不是等到第一个请求才 500
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  throw new Error(`环境变量配置有误：\n${issues}`)
}

const env = parsed.data

export const config = {
  port: env.PORT,
  host: env.HOST,
  openMeteo: {
    baseUrl: env.OPEN_METEO_BASE_URL.replace(/\/$/, ''),
    marineBaseUrl: env.OPEN_METEO_MARINE_BASE_URL.replace(/\/$/, ''),
  },
  cacheTtlMs: env.CACHE_TTL_SECONDS * 1000,
  tide: {
    baseUrl: env.TIDE_API_BASE_URL,
    apiKey: env.TIDE_API_KEY,
    /** 配置了地址与密钥才启用第三方潮汐源 */
    get enabled(): boolean {
      return env.TIDE_API_BASE_URL.length > 0 && env.TIDE_API_KEY.length > 0
    },
  },
  /** 数据源归属与许可，必须随响应下发给前端展示 */
  attribution: {
    weather: 'Open-Meteo（CC BY 4.0）',
    astronomy: 'astronomy-engine',
    tideAstronomical: '本地天文潮推算',
  },
} as const

export type AppConfig = typeof config
