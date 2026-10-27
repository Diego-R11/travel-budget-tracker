import { useReducer, useEffect } from 'react'
import type { Expense } from '../domain/types'

export type ExpenseAction =
  | { type: 'add'; expense: Expense }
  | { type: 'remove'; id: string }

export function expensesReducer(state: Expense[], action: ExpenseAction): Expense[] {
  switch (action.type) {
    case 'add':
      return [...state, action.expense]
    case 'remove':
      return state.filter((e) => e.id !== action.id)
  }
}

const STORAGE_KEY = 'travel-budget:expenses'

function loadExpenses(): Expense[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Expense[]) : []
  } catch {
    return []
  }
}

/** Expense list managed with useReducer and persisted to localStorage. */
export function useExpenses() {
  const [expenses, dispatch] = useReducer(expensesReducer, [], loadExpenses)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    } catch {
      // Storage unavailable: keep working in memory only.
    }
  }, [expenses])

  return {
    expenses,
    addExpense: (expense: Expense) => dispatch({ type: 'add', expense }),
    removeExpense: (id: string) => dispatch({ type: 'remove', id }),
  }
}
