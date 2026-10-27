import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { sortDays } from '../domain/budget'
import { formatDay } from '../domain/format'
import { CATEGORIES, type Category, type Trip } from '../domain/types'
import type { ExpenseDraft } from '../domain/expenses'
import { cn } from '@/lib/utils'

interface Props {
  trip: Trip
  /** Values to start from: today's day for a new expense, or the expense being edited. */
  initial: Partial<ExpenseDraft> & { dayId: string }
  submitLabel: string
  onSubmit: (draft: ExpenseDraft) => void
  idPrefix?: string
}

/** Shared by "add" and "edit": same fields, same validation. */
export function ExpenseForm({ trip, initial, submitLabel, onSubmit, idPrefix = 'new' }: Props) {
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : '')
  const [currency, setCurrency] = useState(initial.currency ?? trip.baseCurrency)
  const [category, setCategory] = useState<Category>(initial.category ?? 'Food')
  const [note, setNote] = useState(initial.note ?? '')
  const [dayId, setDayId] = useState(initial.dayId)
  const [error, setError] = useState('')

  // If the currency was removed in settings, fall back to the base currency.
  const currencyCode = trip.currencies.some((c) => c.code === currency) ? currency : trip.baseCurrency

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseFloat(amount)
    if (!(value > 0)) {
      setError('Enter an amount greater than zero.')
      return
    }
    setError('')
    onSubmit({ amount: value, currency: currencyCode, category, note: note.trim(), dayId })
    setAmount('')
    setNote('')
  }

  const id = (name: string) => `${idPrefix}-${name}`

  return (
    <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off" noValidate>
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor={id('amount')}>Amount</Label>
          <Input
            id={id('amount')}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="tabular-nums"
            aria-invalid={!!error}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('currency')}>Currency</Label>
          <NativeSelect id={id('currency')} value={currencyCode} onChange={(e) => setCurrency(e.target.value)}>
            {trip.currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Category</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={c === category ? 'default' : 'outline'}
              aria-pressed={c === category}
              className={cn('rounded-full', c === 'Emergency' && c !== category && 'text-destructive')}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id('note')}>Note</Label>
          <Input id={id('note')} placeholder="What was it? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('day')}>Day</Label>
          <NativeSelect id={id('day')} value={dayId} onChange={(e) => setDayId(e.target.value)}>
            {sortDays(trip.days).map((d) => (
              <option key={d.id} value={d.id}>
                {formatDay(d.date)} · {d.place}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  )
}
