import { config } from '../../config.js'
import type { WeatherProvider } from '../types.js'
import { OpenMeteoWeatherProvider } from './open-meteo.js'

/**
 * 数据源实例。
 * 换成和风天气或双源比对时，只需在此替换实现，
 * 上层 service 与路由无需改动。
 */
export const weatherProvider: WeatherProvider = new OpenMeteoWeatherProvider({
  baseUrl: config.openMeteo.baseUrl,
  marineBaseUrl: config.openMeteo.marineBaseUrl,
})

export { OpenMeteoWeatherProvider }
