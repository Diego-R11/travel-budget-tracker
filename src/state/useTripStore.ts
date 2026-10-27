import { useEffect, useReducer } from 'react'
import { appReducer, type AppState } from './appReducer'
import { loadState, saveState } from './storage'

/** App state (trip settings + expenses) with useReducer, persisted to localStorage. */
export function useTripStore(initial?: AppState) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => initial ?? loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  return { ...state, dispatch }
}
