import { round2 } from './budget'
import type { Currency, Expense, LiveRates, PlanDay, Trip } from './types'

/** Pure operations to edit the trip configuration. Each returns a new Trip. */

export function updateTrip(
  trip: Trip,
  changes: Partial<Pick<Trip, 'name' | 'emergencyCushion' | 'homeCurrency' | 'autoUpdateRates'>>,
): Trip {
  return { ...trip, ...changes }
}

function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + n))
  return date.toISOString().slice(0, 10)
}

/** Adds a day right after the last one, copying its place, country and budget. */
export function addDay(trip: Trip, id: string, fallbackDate: string, labels = { place: 'New place', country: 'Country' }): Trip {
  const last = [...trip.days].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const day: PlanDay = last
    ? { ...last, id, date: addDaysIso(last.date, 1) }
    : { id, date: fallbackDate, place: labels.place, country: labels.country, budget: 50 }
  return { ...trip, days: [...trip.days, day] }
}

export function updateDay(trip: Trip, id: string, changes: Partial<Omit<PlanDay, 'id'>>): Trip {
  return { ...trip, days: trip.days.map((d) => (d.id === id ? { ...d, ...changes } : d)) }
}

/** Removes a day. The last remaining day can't be removed: a trip needs at least one. */
export function removeDay(trip: Trip, id: string): Trip {
  if (trip.days.length <= 1) return trip
  return { ...trip, days: trip.days.filter((d) => d.id !== id) }
}

export function setAllBudgets(trip: Trip, budget: number): Trip {
  return { ...trip, days: trip.days.map((d) => ({ ...d, budget })) }
}

/** Two days on the same date would make "today" ambiguous. */
export function duplicateDates(days: PlanDay[]): Set<string> {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const d of days) {
    if (seen.has(d.date)) dupes.add(d.date)
    seen.add(d.date)
  }
  return dupes
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export type CurrencyError = 'invalid-code' | 'duplicate' | 'invalid-rate'

export function validateCurrency(trip: Trip, code: string, unitsPerBase: number): CurrencyError | null {
  const normalized = normalizeCode(code)
  if (!/^[A-Z]{3}$/.test(normalized)) return 'invalid-code'
  if (trip.currencies.some((c) => c.code === normalized)) return 'duplicate'
  if (!(unitsPerBase > 0)) return 'invalid-rate'
  return null
}

export function addCurrency(trip: Trip, code: string, unitsPerBase: number): Trip {
  if (validateCurrency(trip, code, unitsPerBase)) return trip
  return { ...trip, currencies: [...trip.currencies, { code: normalizeCode(code), unitsPerBase }] }
}

/** Changing a rate only affects new expenses: saved ones keep the rate they were converted with. */
export function updateRate(trip: Trip, code: string, unitsPerBase: number): Trip {
  if (code === trip.baseCurrency || !(unitsPerBase > 0)) return trip
  return { ...trip, currencies: trip.currencies.map((c) => (c.code === code ? { ...c, unitsPerBase } : c)) }
}

/**
 * The base currency can't be removed. Removing the home currency falls back to the base.
 * Expenses already saved in that currency keep their converted amount, so nothing is lost.
 */
export function removeCurrency(trip: Trip, code: string): Trip {
  if (code === trip.baseCurrency) return trip
  return {
    ...trip,
    homeCurrency: trip.homeCurrency === code ? trip.baseCurrency : trip.homeCurrency,
    currencies: trip.currencies.filter((c) => c.code !== code),
  }
}

/**
 * Switches the base currency. Everything stored in the old base (budgets, cushion,
 * converted expense amounts and the other rates) is re-expressed in the new one,
 * so the totals mean the same money after the change.
 */
export function changeBaseCurrency(trip: Trip, expenses: Expense[], newBase: string): { trip: Trip; expenses: Expense[] } {
  const target = trip.currencies.find((c) => c.code === newBase)
  if (!target || newBase === trip.baseCurrency) return { trip, expenses }
  const factor = target.unitsPerBase // 1 old base = factor new base

  const currencies: Currency[] = trip.currencies.map((c) => ({ ...c, unitsPerBase: c.unitsPerBase / factor }))
  return {
    trip: {
      ...trip,
      baseCurrency: newBase,
      currencies,
      emergencyCushion: round2(trip.emergencyCushion * factor),
      days: trip.days.map((d) => ({ ...d, budget: round2(d.budget * factor) })),
    },
    expenses: expenses.map((e) => ({ ...e, amountBase: round2(e.amountBase * factor) })),
  }
}

export interface ApplyRatesResult {
  trip: Trip
  updated: string[]
  /** Configured currencies the provider doesn't cover: they keep the rate entered by hand. */
  missing: string[]
}

/**
 * Applies live rates to every configured currency the provider knows about.
 * Rates for another base (e.g. a response that arrived after the base changed) are ignored.
 */
export function applyLiveRates(trip: Trip, live: LiveRates): ApplyRatesResult {
  if (live.base !== trip.baseCurrency) return { trip, updated: [], missing: [] }
  const updated: string[] = []
  const missing: string[] = []
  const currencies = trip.currencies.map((c) => {
    if (c.code === trip.baseCurrency) return c
    const rate = live.rates[c.code]
    if (!(rate > 0)) {
      missing.push(c.code)
      return c
    }
    updated.push(c.code)
    // 6 significant digits is plenty for a travel budget and keeps the inputs readable.
    return { ...c, unitsPerBase: Number(rate.toPrecision(6)) }
  })
  return { trip: { ...trip, currencies, ratesUpdatedAt: live.updatedAt }, updated, missing }
}
