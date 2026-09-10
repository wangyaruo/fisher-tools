import type {
  KnowledgeCategory,
  KnowledgeDoc,
  KnowledgeListResponse,
  KnowledgeSearchResponse,
  OverviewResponse,
} from './types'

/** 后端基址。留空时走 Vite 开发代理的相对路径，避免开发期跨域配置 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface QueryPoint {
  latitude: number
  longitude: number
  timezone: string
  name?: string
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  const base = `${API_BASE}${path}`
  return query.length > 0 ? `${base}?${query}` : base
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      signal,
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    // 主动取消不算错误，交由调用方忽略
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('无法连接后端服务，请确认后端已在 3001 端口启动', 0)
  }

  const text = await response.text()
  const payload = text.length > 0 ? safeJson(text) : null

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ?? `请求失败（HTTP ${response.status}）`
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export const api = {
  overview: (point: QueryPoint, at?: string, signal?: AbortSignal) =>
    request<OverviewResponse>('/api/overview', { ...point, at }, signal),

  fishingIndex: (point: QueryPoint, at?: string, signal?: AbortSignal) =>
    request<OverviewResponse['fishingIndex']>('/api/fishing-index', { ...point, at }, signal),

  forecast: (point: QueryPoint, signal?: AbortSignal) =>
    request<OverviewResponse['hourlyWindow']>('/api/forecast', { ...point }, signal),

  knowledgeCategories: () => request<KnowledgeCategory[]>('/api/knowledge/categories'),

  knowledgeList: (category?: string) =>
    request<KnowledgeListResponse>('/api/knowledge', { category }),

  knowledgeDoc: (slug: string) => request<KnowledgeDoc>(`/api/knowledge/${slug}`),

  knowledgeSearch: (q: string, limit = 20) =>
    request<KnowledgeSearchResponse>('/api/knowledge/search', { q, limit }),
}
