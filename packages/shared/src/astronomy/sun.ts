import * as Astronomy from 'astronomy-engine'
import type { SunTimes } from '../schemas'
import { round } from '../utils/number'
import { formatLocalDateTime, zonedTimeToUtc } from '../utils/time'

/**
 * 太阳高度角阈值，对应天文学上的几个标准晨昏时刻。
 * 黄金时段定义为 -4° 至 +6°：该区间光线柔和、水面反光弱，
 * 且多数鱼种正处于晨昏觅食窗口，是路亚与手竿共同的黄金期。
 */
const ALTITUDE = {
  civil: -6,
  nautical: -12,
  goldenLow: -4,
  goldenHigh: 6,
} as const

/**
 * 断言时刻已求得。
 * 中国境内最高纬度约 53.5°N，不存在极昼极夜，理论上不会缺值；
 * 一旦缺值说明坐标或日期异常，此时宁可抛错也不返回编造的时间。
 */
function requireTime(time: Astronomy.AstroTime | null, label: string): Astronomy.AstroTime {
  if (!time) {
    throw new Error(`无法计算${label}，请检查经纬度与日期是否合法`)
  }
  return time
}

export interface ComputeSunParams {
  /** 本地日期，YYYY-MM-DD */
  date: string
  timeZone: string
  latitude: number
  longitude: number
}

/** 计算指定日期的日出日落、晨昏与黄金时段。 */
export function computeSunTimes(params: ComputeSunParams): SunTimes {
  const { date, timeZone, latitude, longitude } = params
  const observer = new Astronomy.Observer(latitude, longitude, 0)
  const dayStart = zonedTimeToUtc(`${date}T00:00`, timeZone)

  const sunrise = requireTime(
    Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, dayStart, 1),
    '日出',
  )
  const sunset = requireTime(
    Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, dayStart, 1),
    '日落',
  )
  const solarNoon = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, dayStart, 1).time

  const ascending = (altitude: number) =>
    requireTime(
      Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, 1, dayStart, 1, altitude),
      `太阳升至 ${altitude}° 的时刻`,
    )
  const descending = (altitude: number) =>
    requireTime(
      Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, dayStart, 1, altitude),
      `太阳降至 ${altitude}° 的时刻`,
    )

  const toLocal = (time: Astronomy.AstroTime) => formatLocalDateTime(time.date, timeZone)

  // 昼长直接以绝对时刻相减，避免把「本地墙上时间字符串」按进程时区二次解析而产生偏差
  const dayLengthMs = sunset.date.getTime() - sunrise.date.getTime()
  if (dayLengthMs <= 0) {
    // 当 timeZone 与经度不匹配时（例如把深圳坐标标成 UTC），
    // 以本地零点为锚的 24 小时搜索窗会把日出与日落取到相邻两天，
    // 从而算出负的昼长。此时必须报错，不能把无意义的值返回给前端。
    throw new Error(
      `日出时刻晚于日落时刻，请确认时区与经纬度是否匹配：` +
        `timeZone=${timeZone}, latitude=${latitude}, longitude=${longitude}`,
    )
  }

  return {
    sunrise: toLocal(sunrise),
    sunset: toLocal(sunset),
    solarNoon: toLocal(solarNoon),
    civilDawn: toLocal(ascending(ALTITUDE.civil)),
    civilDusk: toLocal(descending(ALTITUDE.civil)),
    nauticalDawn: toLocal(ascending(ALTITUDE.nautical)),
    nauticalDusk: toLocal(descending(ALTITUDE.nautical)),
    goldenHourMorningStart: toLocal(ascending(ALTITUDE.goldenLow)),
    goldenHourMorningEnd: toLocal(ascending(ALTITUDE.goldenHigh)),
    goldenHourEveningStart: toLocal(descending(ALTITUDE.goldenHigh)),
    goldenHourEveningEnd: toLocal(descending(ALTITUDE.goldenLow)),
    dayLengthMinutes: round(dayLengthMs / 60_000, 0),
  }
}
