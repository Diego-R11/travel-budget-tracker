import type { Currency, Expense, PlanDay, Trip } from './types'

export const round2 = (n: number) => Math.round(n * 100) / 100

export function findCurrency(currencies: Currency[], code: string): Currency {
  const currency = currencies.find((c) => c.code === code)
  if (!currency) throw new Error(`Unknown currency: ${code}`)
  return currency
}

/** Converts an amount in any configured currency to the base currency, rounded to cents. */
export function toBase(amount: number, code: string, currencies: Currency[]): number {
  return round2(amount / findCurrency(currencies, code).unitsPerBase)
}

/** Converts an amount in the base currency to another configured currency. */
export function fromBase(amountBase: number, code: string, currencies: Currency[]): number {
  return amountBase * findCurrency(currencies, code).unitsPerBase
}

/** Days ordered by date. Editing can leave them out of order, so every view uses this. */
export function sortDays(days: PlanDay[]): PlanDay[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Picks the trip day that represents "today": before the trip it is the first day,
 * after the trip the last one, and in a gap between dates the closest previous day.
 */
export function currentDay(days: PlanDay[], todayIso: string): PlanDay {
  const sorted = sortDays(days)
  let current = sorted[0]
  for (const day of sorted) {
    if (day.date <= todayIso) current = day
  }
  return current
}

/** Index where a new country section starts (the country changes from the previous day). */
export function startsSection(days: PlanDay[], index: number): boolean {
  return index === 0 || days[index].country !== days[index - 1].country
}

const sum = (expenses: Expense[] = []) => expenses.reduce((total, e) => total + e.amountBase, 0)

export interface DaySummary extends PlanDay {
  spent: number
  expenses: Expense[]
}

export interface TripSummary {
  today: DaySummary
  /** Saved (positive) or overspent (negative) on the days before today. */
  carryOver: number
  /** Today's budget plus carry-over, minus what was spent today. */
  availableToday: number
  tripRemaining: number
  /** Planned minus spent up to and including today. Positive = under plan. */
  pace: number
  cushionRemaining: number
  days: DaySummary[]
}

/**
 * Core business rule: whatever you don't spend one day rolls over to the next,
 * and overspending is subtracted from the following days. Emergency expenses
 * come out of a separate cushion instead of the daily budget.
 */
export function summarizeTrip(trip: Trip, expenses: Expense[], todayIso: string): TripSummary {
  const byDay: Record<string, Expense[]> = {}
  for (const expense of expenses) {
    if (expense.category === 'Emergency') continue
    ;(byDay[expense.dayId] ??= []).push(expense)
  }

  const days: DaySummary[] = sortDays(trip.days).map((day) => {
    const dayExpenses = [...(byDay[day.id] ?? [])].sort((a, b) => a.createdAt - b.createdAt)
    return { ...day, spent: sum(dayExpenses), expenses: dayExpenses }
  })

  const todayId = currentDay(trip.days, todayIso).id
  const todayIndex = days.findIndex((d) => d.id === todayId)
  const today = days[todayIndex]
  const before = days.slice(0, todayIndex)
  const upToToday = days.slice(0, todayIndex + 1)

  const carryOver = before.reduce((acc, d) => acc + d.budget - d.spent, 0)
  const totalBudget = days.reduce((acc, d) => acc + d.budget, 0)
  const totalSpent = days.reduce((acc, d) => acc + d.spent, 0)
  const emergencySpent = sum(expenses.filter((e) => e.category === 'Emergency'))

  return {
    today,
    carryOver,
    availableToday: today.budget + carryOver - today.spent,
    tripRemaining: totalBudget - totalSpent,
    pace: upToToday.reduce((acc, d) => acc + d.budget - d.spent, 0),
    cushionRemaining: trip.emergencyCushion - emergencySpent,
    days,
  }
}

export type BarStatus = 'ok' | 'warn' | 'over'

/** Progress bar state: warn from 80% of the budget, over when it's exceeded. */
export function barStatus(spent: number, budget: number): { percent: number; status: BarStatus } {
  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : spent > 0 ? 100 : 0
  if (spent > budget) return { percent, status: 'over' }
  if (percent >= 80) return { percent, status: 'warn' }
  return { percent, status: 'ok' }
}
