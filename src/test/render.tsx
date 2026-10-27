import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import App from '../App'
import { Providers } from '../Providers'
import type { Expense, Trip } from '../domain/types'
import { testTrip } from './fixtures'

/** Renders the app on 1 Jan 2026 with a fresh query cache and no automatic tour. */
export function renderApp({ trip = testTrip, expenses = [] as Expense[] }: { trip?: Trip; expenses?: Expense[] } = {}) {
  const user = userEvent.setup()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    <Providers client={client}>
      <App initialState={{ trip, expenses }} today="2026-01-01" autoStartTour={false} />
    </Providers>,
  )
  return { user, ...utils }
}
