import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { RATES_API } from '../api/exchangeRates'

/** 27 Oct 2026, 00:02 UTC: the provider's last update in the mocked responses. */
export const RATES_UPDATED_UNIX = 1793059351

export function ratesResponse(base: string, rates: Record<string, number>) {
  return {
    result: 'success',
    base_code: base,
    time_last_update_unix: RATES_UPDATED_UNIX,
    rates: { [base]: 1, ...rates },
  }
}

/** Default handler: EUR base with a few currencies. Tests override it with server.use(). */
export const handlers = [
  http.get(`${RATES_API}/:base`, ({ params }) =>
    HttpResponse.json(ratesResponse(String(params.base), { CHF: 0.9, COP: 3500, USD: 1.25 })),
  ),
]

export const server = setupServer(...handlers)
