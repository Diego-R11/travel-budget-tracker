import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type { Trip } from './domain/types'

const trip: Trip = {
  name: 'Test trip',
  emergencyCushion: 100,
  sections: { '2026-01-01': 'Country A' },
  days: [
    { date: '2026-01-01', place: 'City A', budget: 50 },
    { date: '2026-01-02', place: 'City B', budget: 50 },
  ],
}

function setup() {
  const user = userEvent.setup()
  render(<App trip={trip} today="2026-01-01" />)
  return { user }
}

describe('App', () => {
  it('shows the full daily budget when there are no expenses', () => {
    setup()
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50 available')
    expect(screen.getByTestId('trip-remaining')).toHaveTextContent('€100')
  })

  it('adds an expense and updates the summary', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '12.5')
    await user.type(screen.getByLabelText('Note'), 'Lunch')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    expect(screen.getByRole('status')).toHaveTextContent('Saved: €12.5 in food.')
    expect(screen.getByTestId('available-today')).toHaveTextContent('€37.5 available')
    expect(screen.getByText('Lunch')).toBeInTheDocument()
  })

  it('converts other currencies before saving', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '10')
    await user.selectOptions(screen.getByLabelText('Currency'), 'CHF')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    // Default rate: 1 CHF = 1.07 EUR
    expect(screen.getByTestId('available-today')).toHaveTextContent('€39.3 available')
  })

  it('sends emergency expenses to the cushion', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '30')
    await user.click(within(screen.getByRole('group', { name: 'Category' })).getByRole('button', { name: 'Emergency' }))
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    expect(screen.getByTestId('cushion')).toHaveTextContent('€70 of €100')
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50 available')
  })

  it('rejects an empty or zero amount', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByRole('status')).toHaveTextContent('Enter an amount greater than zero.')
  })

  it('asks for confirmation before removing an expense', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '20')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€30 available')

    await user.click(screen.getByRole('button', { name: 'Delete?' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50 available')
  })

  it('keeps expenses after a reload', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '15')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    const stored = JSON.parse(localStorage.getItem('travel-budget:expenses') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].amountEur).toBe(15)
  })
})
