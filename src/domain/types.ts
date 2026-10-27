export type Currency = 'EUR' | 'CHF' | 'COP'

export const CATEGORIES = ['Food', 'Transport', 'Activities', 'Other', 'Emergency'] as const
export type Category = (typeof CATEGORIES)[number]

/** One day of the trip with its planned budget in EUR. */
export interface PlanDay {
  date: string // ISO date, e.g. "2026-10-18"
  place: string
  budget: number
}

export interface Expense {
  id: string
  date: string
  amount: number // amount in the original currency
  currency: Currency
  amountEur: number // converted at the moment it was saved
  category: Category
  note: string
  createdAt: number
}

/** Exchange rates: how many COP per 1 EUR, and how many EUR per 1 CHF. */
export interface Rates {
  copPerEur: number
  eurPerChf: number
}

export interface Trip {
  name: string
  days: PlanDay[]
  emergencyCushion: number
  /** Section titles shown before a given date, e.g. the country you arrive in. */
  sections: Record<string, string>
}
