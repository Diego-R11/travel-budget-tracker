import { describe, expect, it } from 'vitest'
import { makeExpense, testTrip as trip } from '../test/fixtures'
import { barStatus, currentDay, fromBase, startsSection, summarizeTrip, toBase } from './budget'

describe('toBase / fromBase', () => {
  it('converts with "units per base" rates and rounds to cents', () => {
    expect(toBase(10, 'EUR', trip.currencies)).toBe(10)
    expect(toBase(8, 'CHF', trip.currencies)).toBe(10)
    expect(toBase(10000, 'COP', trip.currencies)).toBe(2.5)
    expect(fromBase(2.5, 'COP', trip.currencies)).toBe(10000)
  })

  it('throws for a currency that is not configured', () => {
    expect(() => toBase(1, 'XYZ', trip.currencies)).toThrow('Unknown currency')
  })
})

describe('currentDay', () => {
  it('clamps to the trip and handles gaps and unsorted days', () => {
    const days = [trip.days[2], trip.days[0]] // unsorted, with a gap on the 2nd
    expect(currentDay(days, '2025-12-01').id).toBe('d1')
    expect(currentDay(days, '2026-01-02').id).toBe('d1')
    expect(currentDay(days, '2026-02-01').id).toBe('d3')
  })
})

describe('startsSection', () => {
  it('starts a section when the country changes', () => {
    expect(trip.days.map((_, i) => startsSection(trip.days, i))).toEqual([true, false, true])
  })
})

describe('summarizeTrip', () => {
  it('rolls unspent money over to the next day', () => {
    const s = summarizeTrip(trip, [makeExpense('d1', 30)], '2026-01-02')
    expect(s.carryOver).toBe(20)
    expect(s.availableToday).toBe(70)
    expect(s.pace).toBe(70)
  })

  it('subtracts overspending from the following days', () => {
    const s = summarizeTrip(trip, [makeExpense('d1', 80), makeExpense('d2', 10)], '2026-01-02')
    expect(s.carryOver).toBe(-30)
    expect(s.availableToday).toBe(10)
    expect(s.tripRemaining).toBe(60)
  })

  it('takes emergency expenses from the cushion, not the daily budget', () => {
    const s = summarizeTrip(trip, [makeExpense('d1', 40, { category: 'Emergency' })], '2026-01-01')
    expect(s.cushionRemaining).toBe(60)
    expect(s.today.spent).toBe(0)
    expect(s.tripRemaining).toBe(150)
  })

  it('ignores future days when computing the pace', () => {
    const s = summarizeTrip(trip, [makeExpense('d3', 50)], '2026-01-01')
    expect(s.pace).toBe(50)
    expect(s.tripRemaining).toBe(100)
  })

  it('orders days by date even if they were edited out of order', () => {
    const edited = { ...trip, days: [{ ...trip.days[0], date: '2026-01-05' }, ...trip.days.slice(1)] }
    expect(summarizeTrip(edited, [], '2026-01-01').days.map((d) => d.id)).toEqual(['d2', 'd3', 'd1'])
  })
})

describe('barStatus', () => {
  it('returns ok, warn from 80% and over when exceeded', () => {
    expect(barStatus(10, 50).status).toBe('ok')
    expect(barStatus(40, 50).status).toBe('warn')
    expect(barStatus(60, 50)).toEqual({ percent: 100, status: 'over' })
  })
})
