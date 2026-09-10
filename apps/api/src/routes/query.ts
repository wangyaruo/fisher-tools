import { z } from 'zod'
import { BadRequestError } from '../app.js'

/** 通用点位查询参数。坐标必填，时区默认东八区（用户主要在国内出钓）。 */
export const PointQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().min(1).default('Asia/Shanghai'),
  name: z.string().min(1).max(64).optional(),
})

export const DatedPointQuerySchema = PointQuerySchema.extend({
  /** 本地日期 YYYY-MM-DD，缺省为今天 */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')
    .optional(),
  /** 本地时刻 YYYY-MM-DDTHH:mm，缺省为当前时刻 */
  at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, '时刻格式应为 YYYY-MM-DDTHH:mm')
    .optional(),
})

/** 解析查询参数，失败时抛出 400 而不是 500。 */
export function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || '参数'}: ${issue.message}`)
      .join('；')
    throw new BadRequestError(`查询参数不合法 —— ${detail}`)
  }
  return result.data
}
