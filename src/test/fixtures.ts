import type { Expense, Trip } from '../domain/types'

export const testTrip: Trip = {
  name: 'Test trip',
  baseCurrency: 'EUR',
  homeCurrency: 'COP',
  currencies: [
    { code: 'EUR', unitsPerBase: 1 },
    { code: 'CHF', unitsPerBase: 0.8 },
    { code: 'COP', unitsPerBase: 4000 },
  ],
  emergencyCushion: 100,
  days: [
    { id: 'd1', date: '2026-01-01', place: 'City A', country: 'Country A', budget: 50 },
    { id: 'd2', date: '2026-01-02', place: 'City B', country: 'Country A', budget: 50 },
    { id: 'd3', date: '2026-01-03', place: 'City C', country: 'Country B', budget: 50 },
  ],
}

let n = 0
export function makeExpense(dayId: string, amountBase: number, overrides: Partial<Expense> = {}): Expense {
  n += 1
  return {
    id: `e${n}`,
    dayId,
    amount: amountBase,
    currency: 'EUR',
    amountBase,
    category: 'Food',
    note: '',
    createdAt: n,
    ...overrides,
  }
}
