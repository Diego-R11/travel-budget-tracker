import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { resolveSwipe } from './domain/swipe'
import { makeExpense, testTrip } from './test/fixtures'
import type { Expense } from './domain/types'

function setup(expenses: Expense[] = []) {
  const user = userEvent.setup()
  render(<App initialState={{ trip: testTrip, expenses }} today="2026-01-01" />)
  return { user }
}

async function addExpense(user: ReturnType<typeof userEvent.setup>, amount: string, note = '') {
  await user.type(screen.getByLabelText('Amount'), amount)
  if (note) await user.type(screen.getByLabelText('Note'), note)
  await user.click(screen.getByRole('button', { name: 'Save expense' }))
}

describe('adding expenses', () => {
  it('shows the full daily budget when there are no expenses', () => {
    setup()
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50')
    expect(screen.getByTestId('trip-remaining')).toHaveTextContent('€150')
  })

  it('adds an expense and updates the summary', async () => {
    const { user } = setup()
    await addExpense(user, '12.5', 'Lunch')
    expect(screen.getByTestId('available-today')).toHaveTextContent('€37.50')
    expect(screen.getByText('Lunch')).toBeInTheDocument()
  })

  it('converts other currencies before saving', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '8')
    await user.selectOptions(screen.getByLabelText('Currency'), 'CHF')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€40') // 8 CHF = €10
  })

  it('sends emergency expenses to the cushion', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Amount'), '30')
    await user.click(within(screen.getByRole('group', { name: 'Category' })).getByRole('button', { name: 'Emergency' }))
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByTestId('cushion')).toHaveTextContent('€70 of €100')
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50')
  })

  it('rejects an empty or zero amount', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than zero.')
  })
})

describe('editing and deleting', () => {
  it('shows the swipe hint until the user dismisses it', async () => {
    const { user } = setup([makeExpense('d1', 10, { note: 'Coffee' })])
    expect(screen.getByRole('note')).toHaveTextContent('Swipe left to edit')
    await user.click(screen.getByRole('button', { name: 'Dismiss hint' }))
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(localStorage.getItem('travel-budget:swipe-hint-seen')).toBe('1')
  })

  it('opens the row when swiping left past half of the actions', () => {
    setup([makeExpense('d1', 10, { note: 'Coffee' })])
    const row = screen.getByTestId('swipe-row')
    const content = row.lastElementChild as HTMLElement
    fireEvent.pointerDown(content, { clientX: 300, pointerId: 1 })
    fireEvent.pointerMove(content, { clientX: 200, pointerId: 1 })
    fireEvent.pointerUp(content, { clientX: 200, pointerId: 1 })
    expect(row).toHaveAttribute('data-open', 'true')
    expect(screen.queryByRole('note')).not.toBeInTheDocument() // first swipe hides the hint
  })

  it('edits an expense and recalculates the totals', async () => {
    const { user } = setup([makeExpense('d1', 10, { note: 'Coffee' })])
    await user.click(screen.getByRole('button', { name: 'Edit Coffee' }))

    const dialog = screen.getByRole('dialog', { name: 'Edit expense' })
    const amount = within(dialog).getByLabelText('Amount')
    await user.clear(amount)
    await user.type(amount, '25')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('available-today')).toHaveTextContent('€25')
  })

  it('can move an expense to another day while editing', async () => {
    const { user } = setup([makeExpense('d1', 10, { note: 'Coffee' })])
    await user.click(screen.getByRole('button', { name: 'Edit Coffee' }))
    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Day'), 'd2')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50')
  })

  it('deletes an expense and lets you undo it', async () => {
    const { user } = setup([makeExpense('d1', 20, { note: 'Taxi' })])
    await user.click(screen.getByRole('button', { name: 'Delete Taxi' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€50')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€30')
  })
})

describe('settings', () => {
  it('changes a day budget and the summary follows', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Trip settings' }))
    await user.click(screen.getByRole('tab', { name: 'Days & budget' }))
    const day1 = screen.getByRole('listitem', { name: 'Day 1' })
    const budget = within(day1).getByLabelText('Budget (EUR)')
    await user.clear(budget)
    await user.type(budget, '80')
    expect(screen.getByTestId('available-today')).toHaveTextContent('€80')
  })

  it('renames countries, which regroups the days', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Trip settings' }))
    await user.click(screen.getByRole('tab', { name: 'Days & budget' }))
    const country = within(screen.getByRole('listitem', { name: 'Day 1' })).getByLabelText('Country')
    await user.clear(country)
    await user.type(country, 'Portugal')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('heading', { name: 'Portugal' })).toBeInTheDocument()
  })

  it('adds a currency that can be used right away', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Trip settings' }))
    await user.click(screen.getByRole('tab', { name: 'Currencies' }))
    await user.type(screen.getByLabelText('Currency code'), 'usd')
    await user.type(screen.getByLabelText('Units per 1 EUR'), '1.25')
    await user.click(screen.getByRole('button', { name: 'Add currency' }))
    expect(screen.getByLabelText('USD per EUR')).toHaveValue(1.25)
    await user.keyboard('{Escape}')

    await user.type(screen.getByLabelText('Amount'), '25')
    await user.selectOptions(screen.getByLabelText('Currency'), 'USD')
    await user.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(screen.getByTestId('available-today')).toHaveTextContent('€30') // 25 USD = €20
  })

  it('rejects a duplicate currency', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Trip settings' }))
    await user.click(screen.getByRole('tab', { name: 'Currencies' }))
    await user.type(screen.getByLabelText('Currency code'), 'CHF')
    await user.type(screen.getByLabelText('Units per 1 EUR'), '1')
    await user.click(screen.getByRole('button', { name: 'Add currency' }))
    expect(screen.getByRole('alert')).toHaveTextContent('already in the list')
  })
})

describe('resolveSwipe', () => {
  it('opens past half of the actions width', () => {
    expect(resolveSwipe(-80, 144)).toBe('open')
    expect(resolveSwipe(-60, 144)).toBe('closed')
  })
})
