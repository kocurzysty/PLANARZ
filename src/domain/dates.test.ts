import { describe, expect, it } from 'vitest'
import { addDays, startOfWeek, toLocalDateString, weekDates } from './dates.ts'

describe('dates', () => {
  it('formats local dates without UTC shift', () => {
    expect(toLocalDateString(new Date(2026, 9, 11))).toBe('2026-10-11')
  })

  it('starts the week on Monday', () => {
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05')
    expect(weekDates('2026-10-11')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
  })

  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})
