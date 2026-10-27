import { useEffect, useState } from 'react'

/**
 * useState that persists to localStorage. If storage is unavailable
 * (private mode, blocked cookies) it falls back to plain in-memory state.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? initialValue : (JSON.parse(stored) as T)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage unavailable: keep working in memory only.
    }
  }, [key, value])

  return [value, setValue] as const
}
