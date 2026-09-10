import type {
  AstronomyBundle,
  DailyWeatherPoint,
  DiurnalRangePoint,
  FishingIndex,
  GeoPoint,
  HourlyWeatherPoint,
  KnowledgeDoc,
  KnowledgeHit,
  MarineHourlyPoint,
  PressureTrend,
  TidePrediction,
} from '@fisher-tools/shared/schemas'

export interface OverviewResponse {
  location: GeoPoint
  at: string
  sources: {
    weather: string
    astronomy: string
    tide: string
  }
  fishingIndex: FishingIndex
  current: {
    weather: HourlyWeatherPoint | null
    marine: MarineHourlyPoint | null
  }
  pressureTrend: PressureTrend
  diurnalRanges: DiurnalRangePoint[]
  hourlyWindow: {
    from: string | null
    to: string | null
    weather: HourlyWeatherPoint[]
    marine: MarineHourlyPoint[]
  }
  daily: DailyWeatherPoint[]
  astronomy: AstronomyBundle
  tide: TidePrediction
}

export interface KnowledgeListItem extends Omit<KnowledgeDoc, 'body'> {}

export interface KnowledgeListResponse {
  total: number
  items: KnowledgeListItem[]
}

export interface KnowledgeCategory {
  key: string
  label: string
}

export interface KnowledgeSearchResponse {
  query: string
  total: number
  hits: KnowledgeHit[]
}

export type { AstronomyBundle, FishingIndex, KnowledgeDoc, TidePrediction }
