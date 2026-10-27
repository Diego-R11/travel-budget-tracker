import { useQuery } from '@tanstack/react-query'
import { fetchLiveRates } from './exchangeRates'

/**
 * Live rates for a base currency, cached by TanStack Query. The provider updates
 * once a day, so data is considered fresh for an hour and kept in memory for a day.
 */
export function useLiveRates(base: string, enabled = true) {
  return useQuery({
    queryKey: ['live-rates', base],
    queryFn: ({ signal }) => fetchLiveRates(base, signal),
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}
