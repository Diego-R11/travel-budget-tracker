import * as settings from '../domain/tripSettings'
import type { Expense, LiveRates, PlanDay, Trip } from '../domain/types'

export interface AppState {
  trip: Trip
  expenses: Expense[]
}

/**
 * One reducer for trip settings and expenses, because some actions touch both:
 * removing a day deletes its expenses, and changing the base currency
 * re-expresses every saved amount.
 */
export type AppAction =
  | { type: 'expense/add'; expense: Expense }
  | { type: 'expense/update'; expense: Expense }
  | { type: 'expense/remove'; id: string }
  | { type: 'trip/update'; changes: Parameters<typeof settings.updateTrip>[1] }
  | { type: 'day/add'; id: string; fallbackDate: string; labels?: { place: string; country: string } }
  | { type: 'day/update'; id: string; changes: Partial<Omit<PlanDay, 'id'>> }
  | { type: 'day/remove'; id: string }
  | { type: 'day/setAllBudgets'; budget: number }
  | { type: 'currency/add'; code: string; unitsPerBase: number }
  | { type: 'currency/updateRate'; code: string; unitsPerBase: number }
  | { type: 'currency/remove'; code: string }
  | { type: 'currency/changeBase'; code: string }
  | { type: 'currency/applyLive'; rates: LiveRates }

export function appReducer(state: AppState, action: AppAction): AppState {
  const { trip, expenses } = state
  switch (action.type) {
    case 'expense/add':
      return { ...state, expenses: [...expenses, action.expense] }
    case 'expense/update':
      return { ...state, expenses: expenses.map((e) => (e.id === action.expense.id ? action.expense : e)) }
    case 'expense/remove':
      return { ...state, expenses: expenses.filter((e) => e.id !== action.id) }
    case 'trip/update':
      return { ...state, trip: settings.updateTrip(trip, action.changes) }
    case 'day/add':
      return { ...state, trip: settings.addDay(trip, action.id, action.fallbackDate, action.labels) }
    case 'day/update':
      return { ...state, trip: settings.updateDay(trip, action.id, action.changes) }
    case 'day/remove': {
      const next = settings.removeDay(trip, action.id)
      if (next === trip) return state
      return { trip: next, expenses: expenses.filter((e) => e.dayId !== action.id) }
    }
    case 'day/setAllBudgets':
      return { ...state, trip: settings.setAllBudgets(trip, action.budget) }
    case 'currency/add':
      return { ...state, trip: settings.addCurrency(trip, action.code, action.unitsPerBase) }
    case 'currency/updateRate':
      return { ...state, trip: settings.updateRate(trip, action.code, action.unitsPerBase) }
    case 'currency/remove':
      return { ...state, trip: settings.removeCurrency(trip, action.code) }
    case 'currency/changeBase':
      return settings.changeBaseCurrency(trip, expenses, action.code)
    case 'currency/applyLive':
      return { ...state, trip: settings.applyLiveRates(trip, action.rates).trip }
  }
}
