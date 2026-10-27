import type { Currency, Expense, PlanDay, Rates, Trip } from './types'

/** Converts an amount in any supported currency to EUR, rounded to cents. */
export function toEur(amount: number, currency: Currency, rates: Rates): number {
  let eur: number
  switch (currency) {
    case 'EUR':
      eur = amount
      break
    case 'CHF':
      eur = amount * rates.eurPerChf
      break
    case 'COP':
      eur = amount / rates.copPerEur
      break
  }
  return Math.round(eur * 100) / 100
}

/**
 * Clamps a date to the trip range: before the trip shows the first day,
 * after the trip shows the last day.
 */
export function clampToTrip(date: string, days: PlanDay[]): string {
  const first = days[0].date
  const last = days[days.length - 1].date
  if (date < first) return first
  if (date > last) return last
  return date
}

/** Groups day-to-day expenses by date. Emergency expenses are kept apart. */
export function groupByDay(expenses: Expense[]): Record<string, Expense[]> {
  const groups: Record<string, Expense[]> = {}
  for (const expense of expenses) {
    if (expense.category === 'Emergency') continue
    ;(groups[expense.date] ??= []).push(expense)
  }
  return groups
}

const sum = (expenses: Expense[] = []) => expenses.reduce((total, e) => total + e.amountEur, 0)

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
  const byDay = groupByDay(expenses)
  const today = clampToTrip(todayIso, trip.days)

  const days: DaySummary[] = trip.days.map((day) => {
    const dayExpenses = [...(byDay[day.date] ?? [])].sort((a, b) => a.createdAt - b.createdAt)
    return { ...day, spent: sum(dayExpenses), expenses: dayExpenses }
  })

  const before = days.filter((d) => d.date < today)
  const upToToday = days.filter((d) => d.date <= today)
  const todaySummary = days.find((d) => d.date === today)!

  const carryOver = before.reduce((acc, d) => acc + d.budget - d.spent, 0)
  const totalBudget = days.reduce((acc, d) => acc + d.budget, 0)
  const totalSpent = days.reduce((acc, d) => acc + d.spent, 0)
  const emergencySpent = sum(expenses.filter((e) => e.category === 'Emergency'))

  return {
    today: todaySummary,
    carryOver,
    availableToday: todaySummary.budget + carryOver - todaySummary.spent,
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
