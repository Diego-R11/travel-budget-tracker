import { sampleTrip } from '../data/trip'
import type { Category, Expense } from '../domain/types'
import type { AppState } from './appReducer'

export const STORAGE_KEY = 'travel-budget:v2'

// Data saved by version 1 of the app (fixed trip, EUR only).
const V1_EXPENSES = 'travel-budget:expenses'
interface V1Expense {
  id: string
  date: string
  amount: number
  currency: string
  amountEur: number
  category: Category
  note: string
  createdAt: number
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

/** Moves v1 expenses (keyed by date, amounts in EUR) onto the sample trip's days. */
export function migrateV1(v1: V1Expense[]): Expense[] {
  const dayByDate = new Map(sampleTrip.days.map((d) => [d.date, d.id]))
  return v1
    .filter((e) => dayByDate.has(e.date))
    .map((e) => ({
      id: e.id,
      dayId: dayByDate.get(e.date)!,
      amount: e.amount,
      currency: e.currency,
      amountBase: e.amountEur,
      category: e.category,
      note: e.note,
      createdAt: e.createdAt,
    }))
}

export function loadState(): AppState {
  const saved = read<AppState>(STORAGE_KEY)
  if (saved?.trip?.days?.length) return saved
  const v1 = read<V1Expense[]>(V1_EXPENSES)
  return { trip: sampleTrip, expenses: v1 ? migrateV1(v1) : [] }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable (private mode, blocked cookies): keep working in memory.
  }
}
