import { describe, expect, it } from 'vitest'
import { barStatus, clampToTrip, summarizeTrip, toEur } from './budget'
import type { Expense, Trip } from './types'

const rates = { copPerEur: 4000, eurPerChf: 1.1 }

const trip: Trip = {
  name: 'Test trip',
  emergencyCushion: 100,
  sections: {},
  days: [
    { date: '2026-01-01', place: 'A', budget: 50 },
    { date: '2026-01-02', place: 'B', budget: 50 },
    { date: '2026-01-03', place: 'C', budget: 50 },
  ],
}

let id = 0
function expense(date: string, amountEur: number, category: Expense['category'] = 'Food'): Expense {
  id += 1
  return { id: String(id), date, amount: amountEur, currency: 'EUR', amountEur, category, note: '', createdAt: id }
}

describe('toEur', () => {
  it('converts each currency to EUR and rounds to cents', () => {
    expect(toEur(10, 'EUR', rates)).toBe(10)
    expect(toEur(10, 'CHF', rates)).toBe(11)
    expect(toEur(10000, 'COP', rates)).toBe(2.5)
    expect(toEur(1, 'COP', rates)).toBe(0)
  })
})

describe('clampToTrip', () => {
  it('keeps dates inside the trip range', () => {
    expect(clampToTrip('2025-12-01', trip.days)).toBe('2026-01-01')
    expect(clampToTrip('2026-01-02', trip.days)).toBe('2026-01-02')
    expect(clampToTrip('2026-02-01', trip.days)).toBe('2026-01-03')
  })
})

describe('summarizeTrip', () => {
  it('rolls unspent money over to the next day', () => {
    const summary = summarizeTrip(trip, [expense('2026-01-01', 30)], '2026-01-02')
    expect(summary.carryOver).toBe(20)
    expect(summary.availableToday).toBe(70)
    expect(summary.pace).toBe(70)
  })

  it('subtracts overspending from the following days', () => {
    const summary = summarizeTrip(trip, [expense('2026-01-01', 80), expense('2026-01-02', 10)], '2026-01-02')
    expect(summary.carryOver).toBe(-30)
    expect(summary.availableToday).toBe(10)
    expect(summary.pace).toBe(10)
    expect(summary.tripRemaining).toBe(60)
  })

  it('takes emergency expenses from the cushion, not the daily budget', () => {
    const summary = summarizeTrip(trip, [expense('2026-01-01', 40, 'Emergency')], '2026-01-01')
    expect(summary.cushionRemaining).toBe(60)
    expect(summary.today.spent).toBe(0)
    expect(summary.tripRemaining).toBe(150)
  })

  it('ignores future days when computing the pace', () => {
    const summary = summarizeTrip(trip, [expense('2026-01-03', 50)], '2026-01-01')
    expect(summary.pace).toBe(50)
    expect(summary.tripRemaining).toBe(100)
  })
})

describe('barStatus', () => {
  it('returns ok, warn from 80% and over when exceeded', () => {
    expect(barStatus(10, 50).status).toBe('ok')
    expect(barStatus(40, 50).status).toBe('warn')
    expect(barStatus(60, 50)).toEqual({ percent: 100, status: 'over' })
  })
})
