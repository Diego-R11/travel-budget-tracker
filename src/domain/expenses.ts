import { toBase } from './budget'
import type { Category, Expense, Trip } from './types'

export interface ExpenseDraft {
  amount: number
  currency: string
  category: Category
  note: string
  dayId: string
}

/** Builds the stored expense from a draft, converting to the base currency at the current rate. */
export function draftToExpense(draft: ExpenseDraft, trip: Trip, base: Pick<Expense, 'id' | 'createdAt'>): Expense {
  return { ...base, ...draft, amountBase: toBase(draft.amount, draft.currency, trip.currencies) }
}
