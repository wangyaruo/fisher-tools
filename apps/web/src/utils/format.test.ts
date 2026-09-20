import { describe, expect, it } from 'vitest'
import {
  duration,
  gradeClass,
  hhmm,
  minutesOfDay,
  minutesToHhmm,
  mmdd,
  mmddhhmm,
  number,
  percent,
  signed,
  windDirection,
} from './format'

describe('hhmm / mmdd / mmddhhmm', () => {
  it('截取本地墙上时间的时分部分', () => {
    expect(hhmm('2026-09-18T06:30')).toBe('06:30')
    expect(mmdd('2026-09-18T06:30')).toBe('09-18')
    expect(mmddhhmm('2026-09-18T06:30')).toBe('09-18 06:30')
  })

  it('空值统一返回占位符', () => {
    expect(hhmm(null)).toBe('—')
    expect(hhmm(undefined)).toBe('—')
    expect(mmdd('')).toBe('—')
    expect(mmddhhmm(null)).toBe('—')
  })

  it('已是 HH:mm 的输入原样返回，不做二次解析', () => {
    expect(hhmm('06:30')).toBe('06:30')
  })
})

describe('number / signed / percent', () => {
  it('缺失值与 NaN 返回占位符', () => {
    expect(number(null)).toBe('—')
    expect(number(undefined)).toBe('—')
    expect(number(Number.NaN)).toBe('—')
    expect(signed(null)).toBe('—')
    expect(percent(null)).toBe('—')
  })

  it('按精度格式化', () => {
    expect(number(12.345)).toBe('12.3')
    expect(number(12.345, 2)).toBe('12.35')
    expect(percent(0.756)).toBe('76%')
    expect(percent(0.5, 1)).toBe('50.0%')
  })

  it('signed 仅对正数补正号', () => {
    expect(signed(3.2)).toBe('+3.2')
    expect(signed(-1.5)).toBe('-1.5')
    expect(signed(0)).toBe('0.0')
  })
})

describe('windDirection', () => {
  it('16 方位换算', () => {
    expect(windDirection(0)).toBe('北')
    expect(windDirection(90)).toBe('东')
    expect(windDirection(180)).toBe('南')
    expect(windDirection(270)).toBe('西')
    expect(windDirection(359)).toBe('北')
    expect(windDirection(23)).toBe('北东北')
  })

  it('负角度先归一化再换算', () => {
    expect(windDirection(-10)).toBe('北')
    expect(windDirection(-90)).toBe('西')
  })

  it('缺失值返回占位符', () => {
    expect(windDirection(null)).toBe('—')
  })
})

describe('duration', () => {
  it('分钟转中文时长', () => {
    expect(duration(95)).toBe('1 小时 35 分')
    expect(duration(45)).toBe('45 分')
    expect(duration(60)).toBe('1 小时 0 分')
    expect(duration(null)).toBe('—')
  })
})

describe('minutesOfDay / minutesToHhmm', () => {
  it('两种输入形式都能取到当天分钟数', () => {
    expect(minutesOfDay('06:30')).toBe(390)
    expect(minutesOfDay('2026-09-18T06:30')).toBe(390)
  })

  it('非法输入返回 null', () => {
    expect(minutesOfDay(null)).toBeNull()
    expect(minutesOfDay('没有时刻')).toBeNull()
  })

  it('分钟数转 HH:mm，超出一天按 24 小时取模', () => {
    expect(minutesToHhmm(390)).toBe('06:30')
    expect(minutesToHhmm(1440)).toBe('00:00')
    expect(minutesToHhmm(1500)).toBe('01:00')
    expect(minutesToHhmm(-30)).toBe('23:30')
  })

  it('与 minutesOfDay 互逆', () => {
    expect(minutesToHhmm(minutesOfDay('23:59')!)).toBe('23:59')
  })
})

describe('gradeClass', () => {
  it('已知等级映射到对应类名，未知等级回落 is-fair', () => {
    expect(gradeClass('excellent')).toBe('is-excellent')
    expect(gradeClass('bad')).toBe('is-bad')
    expect(gradeClass('不存在的等级')).toBe('is-fair')
  })
})
