export const CATEGORIES = ['Food', 'Transport', 'Activities', 'Other', 'Emergency'] as const
export type Category = (typeof CATEGORIES)[number]

/**
 * A currency and its exchange rate against the trip's base currency,
 * expressed as "how many units of this currency you get for 1 base unit"
 * (e.g. with EUR as base: COP 3650, CHF 0.93). The base currency has rate 1.
 */
export interface Currency {
  code: string
  unitsPerBase: number
}

/** One day of the trip with its planned budget in the base currency. */
export interface PlanDay {
  id: string
  date: string // ISO date, e.g. "2026-10-18"
  place: string
  country: string
  budget: number
}

export interface Trip {
  name: string
  baseCurrency: string
  /** Currency shown as a secondary reference next to totals (e.g. your home currency). */
  homeCurrency: string
  currencies: Currency[]
  emergencyCushion: number
  days: PlanDay[]
  /** Fetch live exchange rates when the app opens. */
  autoUpdateRates: boolean
  /** When the rates were last taken from the API (ms). Undefined = entered by hand. */
  ratesUpdatedAt?: number
}

export interface Expense {
  id: string
  dayId: string
  amount: number // amount in the original currency
  currency: string
  amountBase: number // converted to the base currency when saved
  category: Category
  note: string
  createdAt: number
}

/** Exchange rates from an online provider, in "units per 1 base" like Currency. */
export interface LiveRates {
  base: string
  rates: Record<string, number>
  /** When the provider last refreshed the rates (ms). */
  updatedAt: number
}
