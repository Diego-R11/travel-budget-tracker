import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { fetchLiveRates, RATES_API } from './api/exchangeRates'
import { applyLiveRates } from './domain/tripSettings'
import i18n from './i18n'
import { testTrip } from './test/fixtures'
import { renderApp } from './test/render'
import { RATES_UPDATED_UNIX, ratesResponse, server } from './test/server'

const live = { base: 'EUR', rates: { EUR: 1, CHF: 0.9, USD: 1.25 }, updatedAt: RATES_UPDATED_UNIX * 1000 }

async function openCurrencies(user: ReturnType<typeof renderApp>['user']) {
  await user.click(screen.getByRole('button', { name: 'Trip settings' }))
  await user.click(screen.getByRole('tab', { name: 'Currencies' }))
}

describe('fetchLiveRates', () => {
  it('maps the API response to our rate format', async () => {
    await expect(fetchLiveRates('EUR')).resolves.toEqual({
      base: 'EUR',
      rates: { EUR: 1, CHF: 0.9, COP: 3500, USD: 1.25 },
      updatedAt: RATES_UPDATED_UNIX * 1000,
    })
  })

  it('fails on HTTP errors and on API-level errors', async () => {
    server.use(http.get(`${RATES_API}/:base`, () => new HttpResponse(null, { status: 503 })))
    await expect(fetchLiveRates('EUR')).rejects.toThrow('503')

    server.use(http.get(`${RATES_API}/:base`, () => HttpResponse.json({ result: 'error', 'error-type': 'unsupported-code' })))
    await expect(fetchLiveRates('XXX')).rejects.toThrow('unsupported-code')
  })
})

describe('applyLiveRates', () => {
  it('updates known currencies, reports missing ones and keeps the base at 1', () => {
    const { trip, updated, missing } = applyLiveRates(testTrip, live)
    expect(updated).toEqual(['CHF'])
    expect(missing).toEqual(['COP'])
    expect(trip.currencies).toEqual([
      { code: 'EUR', unitsPerBase: 1 },
      { code: 'CHF', unitsPerBase: 0.9 },
      { code: 'COP', unitsPerBase: 4000 },
    ])
    expect(trip.ratesUpdatedAt).toBe(live.updatedAt)
  })

  it('ignores rates for a different base currency', () => {
    expect(applyLiveRates(testTrip, { ...live, base: 'USD' }).trip).toBe(testTrip)
  })
})

describe('live exchange rates in the app', () => {
  it('applies live rates automatically when auto-update is on', async () => {
    const { user } = renderApp({ trip: { ...testTrip, autoUpdateRates: true } })
    await openCurrencies(user)
    await waitFor(() => expect(screen.getByLabelText('CHF per EUR')).toHaveValue(0.9))
    expect(screen.getByLabelText('COP per EUR')).toHaveValue(3500)
    expect(screen.getByTestId('rates-updated')).toHaveTextContent('Rates from Oct 27, 2026')
  })

  it('does not call the API when auto-update is off', async () => {
    let calls = 0
    server.use(
      http.get(`${RATES_API}/:base`, () => {
        calls += 1
        return HttpResponse.json(ratesResponse('EUR', {}))
      }),
    )
    renderApp()
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toBe(0)
  })

  it('updates rates on demand and reports currencies without a live rate', async () => {
    server.use(http.get(`${RATES_API}/:base`, () => HttpResponse.json(ratesResponse('EUR', { CHF: 0.95 }))))
    const { user } = renderApp()
    await openCurrencies(user)
    await user.click(screen.getByRole('button', { name: 'Update rates' }))

    expect(await screen.findByText(/Updated 1 rate\. No live rate for: COP/)).toBeInTheDocument()
    expect(screen.getByLabelText('CHF per EUR')).toHaveValue(0.95)
  })

  it('shows an error when the rates cannot be loaded', async () => {
    server.use(http.get(`${RATES_API}/:base`, () => HttpResponse.error()))
    const { user } = renderApp()
    await openCurrencies(user)
    await user.click(screen.getByRole('button', { name: 'Update rates' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the rates")
    expect(screen.getByLabelText('CHF per EUR')).toHaveValue(0.8) // unchanged
  })

  it('suggests the live rate when adding a currency', async () => {
    const { user } = renderApp()
    await openCurrencies(user)
    await user.type(screen.getByLabelText('Currency code'), 'usd')
    const suggestion = await screen.findByTestId('rate-suggestion')
    expect(suggestion).toHaveTextContent('1 EUR = 1.25 USD')

    await user.click(within(suggestion).getByRole('button', { name: 'Use' }))
    expect(screen.getByLabelText('Units per 1 EUR')).toHaveValue(1.25)
  })
})

describe('language', () => {
  it('switches the whole interface to Spanish, with Spanish number formats', async () => {
    const { user } = renderApp()
    await user.type(screen.getByLabelText('Amount'), '12.5')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    await user.click(screen.getByRole('button', { name: 'ES' }))

    expect(screen.getByRole('button', { name: 'Guardar gasto' })).toBeInTheDocument()
    expect(screen.getByText('disponible hoy')).toBeInTheDocument()
    expect(screen.getByTestId('available-today')).toHaveTextContent('€37,50')
    expect(screen.getByRole('button', { name: 'Comida' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.lang).toBe('es')
    expect(localStorage.getItem('travel-budget:language')).toBe('es')
  })

  it('uses plural forms in each language', () => {
    expect(i18n.t('settings.daysTotal', { count: 1, total: '€5' })).toBe('1 day · total €5')
    expect(i18n.t('settings.daysTotal', { count: 3, total: '€5', lng: 'es' })).toBe('3 días · total €5')
  })
})

describe('guided tour', () => {
  it('opens from the help button in the current language', async () => {
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'ES' }))
    await user.click(screen.getByRole('button', { name: 'Cómo funciona' }))
    expect(await screen.findByText('Bienvenido 👋')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(await screen.findByText('Lo que puedes gastar hoy')).toBeInTheDocument()
  })
})

describe('rate precision', () => {
  it('rounds live rates to 6 significant digits', () => {
    const { trip } = applyLiveRates(testTrip, { ...live, rates: { CHF: 0.92489612, COP: 3533.296249 } })
    expect(trip.currencies.map((c) => c.unitsPerBase)).toEqual([1, 0.924896, 3533.3])
  })
})
