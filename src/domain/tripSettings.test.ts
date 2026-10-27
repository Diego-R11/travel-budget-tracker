import { describe, expect, it } from 'vitest'
import { makeExpense, testTrip as trip } from '../test/fixtures'
import { summarizeTrip } from './budget'
import {
  addCurrency,
  addDay,
  changeBaseCurrency,
  duplicateDates,
  removeCurrency,
  removeDay,
  setAllBudgets,
  updateRate,
  validateCurrency,
} from './tripSettings'

describe('days', () => {
  it('adds a day after the last one, copying its details', () => {
    const next = addDay(trip, 'd4', '2030-01-01')
    expect(next.days.at(-1)).toEqual({ id: 'd4', date: '2026-01-04', place: 'City C', country: 'Country B', budget: 50 })
  })

  it('never removes the last remaining day', () => {
    const single = { ...trip, days: [trip.days[0]] }
    expect(removeDay(single, 'd1')).toBe(single)
    expect(removeDay(trip, 'd2').days.map((d) => d.id)).toEqual(['d1', 'd3'])
  })

  it('sets the same budget for every day', () => {
    expect(setAllBudgets(trip, 30).days.every((d) => d.budget === 30)).toBe(true)
  })

  it('detects duplicate dates', () => {
    const days = [...trip.days, { ...trip.days[0], id: 'x' }]
    expect([...duplicateDates(days)]).toEqual(['2026-01-01'])
  })
})

describe('currencies', () => {
  it('validates code format, duplicates and rate', () => {
    expect(validateCurrency(trip, 'us', 1)).toBe('invalid-code')
    expect(validateCurrency(trip, 'chf', 1)).toBe('duplicate')
    expect(validateCurrency(trip, 'USD', 0)).toBe('invalid-rate')
    expect(validateCurrency(trip, ' usd ', 1.1)).toBeNull()
  })

  it('adds a currency with a normalized code', () => {
    expect(addCurrency(trip, 'usd', 1.1).currencies.at(-1)).toEqual({ code: 'USD', unitsPerBase: 1.1 })
  })

  it("doesn't change the base rate or accept invalid rates", () => {
    expect(updateRate(trip, 'EUR', 2)).toBe(trip)
    expect(updateRate(trip, 'CHF', -1)).toBe(trip)
    expect(updateRate(trip, 'CHF', 0.9).currencies[1].unitsPerBase).toBe(0.9)
  })

  it("can't remove the base; removing the home currency falls back to the base", () => {
    expect(removeCurrency(trip, 'EUR')).toBe(trip)
    const next = removeCurrency(trip, 'COP')
    expect(next.homeCurrency).toBe('EUR')
    expect(next.currencies.map((c) => c.code)).toEqual(['EUR', 'CHF'])
  })
})

describe('changeBaseCurrency', () => {
  it('re-expresses budgets, cushion, rates and expenses in the new base', () => {
    const expenses = [makeExpense('d1', 10, { currency: 'CHF', amount: 8 })]
    const result = changeBaseCurrency(trip, expenses, 'CHF')

    expect(result.trip.baseCurrency).toBe('CHF')
    expect(result.trip.days[0].budget).toBe(40) // €50 × 0.8
    expect(result.trip.emergencyCushion).toBe(80)
    expect(result.trip.currencies.find((c) => c.code === 'EUR')!.unitsPerBase).toBe(1.25)
    expect(result.trip.currencies.find((c) => c.code === 'CHF')!.unitsPerBase).toBe(1)
    expect(result.expenses[0].amountBase).toBe(8)
  })

  it('keeps the same money: remaining budget converts by the rate', () => {
    const expenses = [makeExpense('d1', 20)]
    const before = summarizeTrip(trip, expenses, '2026-01-02').tripRemaining
    const after = changeBaseCurrency(trip, expenses, 'CHF')
    expect(summarizeTrip(after.trip, after.expenses, '2026-01-02').tripRemaining).toBeCloseTo(before * 0.8)
  })
})
