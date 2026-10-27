import { describe, expect, it } from 'vitest'
import { makeExpense, testTrip } from '../test/fixtures'
import { appReducer } from './appReducer'
import { loadState, migrateV1, STORAGE_KEY } from './storage'

describe('appReducer', () => {
  it('removing a day also removes its expenses', () => {
    const state = { trip: testTrip, expenses: [makeExpense('d1', 5), makeExpense('d2', 7)] }
    const next = appReducer(state, { type: 'day/remove', id: 'd1' })
    expect(next.trip.days.map((d) => d.id)).toEqual(['d2', 'd3'])
    expect(next.expenses.map((e) => e.dayId)).toEqual(['d2'])
  })

  it('updates an expense in place', () => {
    const e = makeExpense('d1', 5)
    const next = appReducer({ trip: testTrip, expenses: [e] }, { type: 'expense/update', expense: { ...e, note: 'Fixed' } })
    expect(next.expenses).toEqual([{ ...e, note: 'Fixed' }])
  })
})

describe('storage', () => {
  it('migrates v1 expenses (by date, in EUR) to the sample trip days', () => {
    const migrated = migrateV1([
      { id: 'a', date: '2026-10-18', amount: 12, currency: 'EUR', amountEur: 12, category: 'Food', note: 'x', createdAt: 1 },
      { id: 'b', date: '1999-01-01', amount: 1, currency: 'EUR', amountEur: 1, category: 'Food', note: '', createdAt: 2 },
    ])
    expect(migrated).toEqual([
      { id: 'a', dayId: 'day-2026-10-18', amount: 12, currency: 'EUR', amountBase: 12, category: 'Food', note: 'x', createdAt: 1 },
    ])
  })

  it('loads saved state and falls back to the sample trip', () => {
    expect(loadState().trip.name).toBe('Europe 2026')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trip: testTrip, expenses: [] }))
    expect(loadState().trip.name).toBe('Test trip')
    localStorage.setItem(STORAGE_KEY, '{broken json')
    expect(loadState().trip.name).toBe('Europe 2026')
  })
})
