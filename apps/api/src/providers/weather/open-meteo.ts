import { z } from 'zod'
import type {
  DailyWeatherPoint,
  Forecast,
  GeoPoint,
  HourlyWeatherPoint,
  MarineHourlyPoint,
} from '@fisher-tools/shared/schemas'
import { UpstreamError } from '../../app.js'
import type { FetchForecastOptions, WeatherProvider } from '../types.js'

/** 逐小时要素字段清单。与 Open-Meteo 的字段名一一对应，不做重命名以免对不上文档。 */
const HOURLY_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'dew_point_2m',
  'precipitation_probability',
  'precipitation',
  'cloud_cover',
  'pressure_msl',
  'surface_pressure',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'visibility',
  'uv_index',
  'is_day',
] as const

const DAILY_FIELDS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'uv_index_max',
] as const

const MARINE_FIELDS = [
  'wave_height',
  'wave_period',
  'wave_direction',
  'sea_surface_temperature',
] as const

const numberArray = z.array(z.number().nullable()).optional()
const stringArray = z.array(z.string()).optional()

const OpenMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  hourly: z
    .object({
      time: z.array(z.string()),
      ...Object.fromEntries(HOURLY_FIELDS.map((field) => [field, numberArray])),
    })
    .optional(),
  daily: z
    .object({
      time: z.array(z.string()),
      ...Object.fromEntries(
        DAILY_FIELDS.map((field) => [
          field,
          field === 'sunrise' || field === 'sunset' ? stringArray : numberArray,
        ]),
      ),
    })
    .optional(),
})

const MarineResponseSchema = z.object({
  hourly: z
    .object({
      time: z.array(z.string()),
      ...Object.fromEntries(MARINE_FIELDS.map((field) => [field, numberArray])),
    })
    .optional(),
})

type HourlyBlock = Record<string, Array<number | string | null> | undefined>

/**
 * 取值并断言存在。
 * 核心要素缺失说明上游返回了残缺数据，此时必须报错，
 * 而不是用 0 兜底——那会把「没数据」变成「气压为 0」，直接污染评分结论。
 */
function requireNumber(values: Array<number | null> | undefined, index: number, field: string): number {
  const value = values?.[index]
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new UpstreamError(
      `上游返回的 ${field} 缺少第 ${index} 项有效数值，数据结构可能已变更`,
      'open-meteo',
    )
  }
  return value
}

/** 次要要素缺失时允许兜底，但取值口径在注释中明确写出。 */
function optionalNumber(values: Array<number | null> | undefined, index: number, fallback = 0): number {
  const value = values?.[index]
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

function mapHourly(block: HourlyBlock): HourlyWeatherPoint[] {
  const times = block.time as string[] | undefined
  if (!times || times.length === 0) {
    throw new UpstreamError('上游未返回逐小时时间序列', 'open-meteo')
  }
  const pick = (field: string) => block[field] as Array<number | null> | undefined

  return times.map((time, i) => ({
    time,
    temperature: requireNumber(pick('temperature_2m'), i, 'temperature_2m'),
    apparentTemperature: optionalNumber(pick('apparent_temperature'), i),
    dewPoint: optionalNumber(pick('dew_point_2m'), i),
    relativeHumidity: optionalNumber(pick('relative_humidity_2m'), i),
    surfacePressure: requireNumber(pick('surface_pressure'), i, 'surface_pressure'),
    pressureMsl: requireNumber(pick('pressure_msl'), i, 'pressure_msl'),
    windSpeed: requireNumber(pick('wind_speed_10m'), i, 'wind_speed_10m'),
    windGust: optionalNumber(pick('wind_gusts_10m'), i),
    windDirection: requireNumber(pick('wind_direction_10m'), i, 'wind_direction_10m'),
    cloudCover: requireNumber(pick('cloud_cover'), i, 'cloud_cover'),
    precipitation: requireNumber(pick('precipitation'), i, 'precipitation'),
    precipitationProbability: optionalNumber(pick('precipitation_probability'), i),
    // 能见度与紫外线缺失较常见，缺省 0 表示「未知」，不影响评分因子（二者均未参与评分）
    visibility: optionalNumber(pick('visibility'), i),
    uvIndex: optionalNumber(pick('uv_index'), i),
    isDay: optionalNumber(pick('is_day'), i) === 1,
  }))
}

function mapDaily(block: HourlyBlock): DailyWeatherPoint[] {
  const times = block.time as string[] | undefined
  if (!times || times.length === 0) {
    throw new UpstreamError('上游未返回逐日时间序列', 'open-meteo')
  }
  const pick = (field: string) => block[field] as Array<number | null> | undefined
  const pickString = (field: string) => block[field] as Array<string | null> | undefined

  return times.map((date, i) => ({
    date,
    temperatureMax: requireNumber(pick('temperature_2m_max'), i, 'temperature_2m_max'),
    temperatureMin: requireNumber(pick('temperature_2m_min'), i, 'temperature_2m_min'),
    sunrise: pickString('sunrise')?.[i] ?? `${date}T06:00`,
    sunset: pickString('sunset')?.[i] ?? `${date}T18:00`,
    precipitationSum: optionalNumber(pick('precipitation_sum'), i),
    precipitationProbabilityMax: optionalNumber(pick('precipitation_probability_max'), i),
    windSpeedMax: optionalNumber(pick('wind_speed_10m_max'), i),
    windGustsMax: optionalNumber(pick('wind_gusts_10m_max'), i),
    windDirectionDominant: optionalNumber(pick('wind_direction_10m_dominant'), i),
    uvIndexMax: optionalNumber(pick('uv_index_max'), i),
  }))
}

function mapMarine(block: HourlyBlock): MarineHourlyPoint[] {
  const times = block.time as string[] | undefined
  if (!times) return []
  const pick = (field: string) => block[field] as Array<number | null> | undefined
  const nullable = (values: Array<number | null> | undefined, i: number): number | null => {
    const value = values?.[i]
    return typeof value === 'number' && !Number.isNaN(value) ? value : null
  }
  return times.map((time, i) => ({
    time,
    waveHeight: nullable(pick('wave_height'), i),
    wavePeriod: nullable(pick('wave_period'), i),
    waveDirection: nullable(pick('wave_direction'), i),
    seaSurfaceTemperature: nullable(pick('sea_surface_temperature'), i),
  }))
}

async function getJson(url: URL, source: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    throw new UpstreamError(`请求 ${source} 失败：${(error as Error).message}`, source, error)
  }
  if (!response.ok) {
    throw new UpstreamError(`${source} 返回 HTTP ${response.status}`, source)
  }
  return response.json()
}

export interface OpenMeteoOptions {
  baseUrl: string
  marineBaseUrl: string
}

/** Open-Meteo 数据源实现。免费、无需 API Key，数据以 CC BY 4.0 发布。 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = 'open-meteo'
  readonly attribution = 'Open-Meteo（CC BY 4.0）'

  private readonly options: OpenMeteoOptions

  constructor(options: OpenMeteoOptions) {
    this.options = options
  }

  async fetchForecast(point: GeoPoint, options: FetchForecastOptions = {}): Promise<Forecast> {
    const forecastDays = options.forecastDays ?? 7
    const pastDays = options.pastDays ?? 1

    const forecastUrl = new URL('/v1/forecast', this.options.baseUrl)
    forecastUrl.searchParams.set('latitude', String(point.latitude))
    forecastUrl.searchParams.set('longitude', String(point.longitude))
    forecastUrl.searchParams.set('hourly', HOURLY_FIELDS.join(','))
    forecastUrl.searchParams.set('daily', DAILY_FIELDS.join(','))
    forecastUrl.searchParams.set('timezone', point.timezone)
    forecastUrl.searchParams.set('forecast_days', String(forecastDays))
    forecastUrl.searchParams.set('past_days', String(pastDays))

    const raw = OpenMeteoResponseSchema.parse(await getJson(forecastUrl, 'open-meteo'))
    if (!raw.hourly || !raw.daily) {
      throw new UpstreamError('上游未返回 hourly 或 daily 数据块', 'open-meteo')
    }

    // 海洋数据独立请求：内陆坐标会返回错误，属预期情况而非故障，
    // 因此失败时降级为空数组并置 hasMarineData=false，由前端隐藏相关面板
    let marine: MarineHourlyPoint[] = []
    try {
      const marineUrl = new URL('/v1/marine', this.options.marineBaseUrl)
      marineUrl.searchParams.set('latitude', String(point.latitude))
      marineUrl.searchParams.set('longitude', String(point.longitude))
      marineUrl.searchParams.set('hourly', MARINE_FIELDS.join(','))
      marineUrl.searchParams.set('timezone', point.timezone)
      marineUrl.searchParams.set('forecast_days', String(forecastDays))
      const rawMarine = MarineResponseSchema.parse(
        await getJson(marineUrl, 'open-meteo-marine'),
      )
      marine = rawMarine.hourly ? mapMarine(rawMarine.hourly as HourlyBlock) : []
    } catch {
      marine = []
    }

    return {
      location: point,
      fetchedAt: new Date().toISOString(),
      source: this.attribution,
      hasMarineData: marine.some((point_) => point_.waveHeight !== null),
      hourly: mapHourly(raw.hourly as HourlyBlock),
      daily: mapDaily(raw.daily as HourlyBlock),
      marine,
    }
  }
}
