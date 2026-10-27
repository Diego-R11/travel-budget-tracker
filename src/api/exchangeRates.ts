import type { LiveRates } from '../domain/types'

export const RATES_API = 'https://open.er-api.com/v6/latest'

interface ApiResponse {
  result: 'success' | 'error'
  base_code: string
  time_last_update_unix: number
  rates: Record<string, number>
  'error-type'?: string
}

/**
 * Free, key-less endpoint from ExchangeRate-API (refreshed daily, CORS enabled).
 * The response already uses our convention: units of each currency per 1 base.
 */
export async function fetchLiveRates(base: string, signal?: AbortSignal): Promise<LiveRates> {
  const response = await fetch(`${RATES_API}/${encodeURIComponent(base)}`, { signal })
  if (!response.ok) throw new Error(`Rates request failed: ${response.status}`)
  const data = (await response.json()) as ApiResponse
  if (data.result !== 'success') throw new Error(`Rates API error: ${data['error-type'] ?? 'unknown'}`)
  return { base: data.base_code, rates: data.rates, updatedAt: data.time_last_update_unix * 1000 }
}
