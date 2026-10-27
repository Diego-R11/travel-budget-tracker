import { useState, type FormEvent } from 'react'
import { toEur } from '../domain/budget'
import { formatDay, formatEur } from '../domain/format'
import { CATEGORIES, type Category, type Currency, type Expense, type PlanDay, type Rates } from '../domain/types'

interface Props {
  days: PlanDay[]
  defaultDate: string
  rates: Rates
  onAdd: (expense: Expense) => void
}

export function ExpenseForm({ days, defaultDate, rates, onAdd }: Props) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [category, setCategory] = useState<Category>('Food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseFloat(amount)
    if (!(value > 0)) {
      setStatus('Enter an amount greater than zero.')
      return
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      date,
      amount: value,
      currency,
      amountEur: toEur(value, currency, rates),
      category,
      note: note.trim(),
      createdAt: Date.now(),
    }
    onAdd(expense)
    setStatus(`Saved: ${formatEur(expense.amountEur)} in ${category.toLowerCase()}.`)
    setAmount('')
    setNote('')
  }

  return (
    <form className="card entry" onSubmit={handleSubmit} autoComplete="off">
      <span className="label">Add expense</span>

      <div className="row">
        <input
          className="num grow-2"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="Amount"
          aria-label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
          <option value="EUR">€ EUR</option>
          <option value="CHF">CHF</option>
          <option value="COP">COP</option>
        </select>
      </div>

      <div className="chips" role="group" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" aria-pressed={c === category} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="row">
        <input
          type="text"
          placeholder="What was it? (optional)"
          aria-label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <select aria-label="Day" value={date} onChange={(e) => setDate(e.target.value)}>
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {formatDay(d.date)} · {d.place}
            </option>
          ))}
        </select>
      </div>

      <button className="primary" type="submit">
        Save expense
      </button>
      <div className="status" role="status">
        {status}
      </div>
    </form>
  )
}
