import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { validateCurrency, type CurrencyError } from '../../domain/tripSettings'
import type { Expense, Trip } from '../../domain/types'
import type { AppAction } from '../../state/appReducer'
import { NumberField } from './NumberField'

const ERRORS: Record<CurrencyError, string> = {
  'invalid-code': 'Use a 3-letter code, like USD or GBP.',
  duplicate: 'That currency is already in the list.',
  'invalid-rate': 'The rate must be greater than zero.',
}

interface Props {
  trip: Trip
  expenses: Expense[]
  dispatch: (a: AppAction) => void
}

export function CurrenciesSettings({ trip, expenses, dispatch }: Props) {
  const [code, setCode] = useState('')
  const [rate, setRate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const base = trip.baseCurrency

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const problem = validateCurrency(trip, code, Number(rate))
    if (problem) return setError(ERRORS[problem])
    dispatch({ type: 'currency/add', code, unitsPerBase: Number(rate) })
    setCode('')
    setRate('')
    setError(null)
  }

  return (
    <div className="space-y-5 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="base-currency">Base currency</Label>
          <NativeSelect
            id="base-currency"
            value={base}
            onChange={(e) => dispatch({ type: 'currency/changeBase', code: e.target.value })}
          >
            {trip.currencies.map((c) => (
              <option key={c.code}>{c.code}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home-currency">Show totals also in</Label>
          <NativeSelect
            id="home-currency"
            value={trip.homeCurrency}
            onChange={(e) => dispatch({ type: 'trip/update', changes: { homeCurrency: e.target.value } })}
          >
            {trip.currencies.map((c) => (
              <option key={c.code}>{c.code}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <p className="text-muted-foreground -mt-3 text-xs">
        Budgets are set in the base currency. Changing it converts budgets and saved expenses with the rates below.
      </p>

      <ul className="space-y-2" aria-label="Currencies">
        {trip.currencies.map((c) => {
          const used = expenses.some((e) => e.currency === c.code)
          return (
            <li key={c.code} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Badge variant={c.code === base ? 'default' : 'secondary'} className="w-12">
                {c.code}
              </Badge>
              {c.code === base ? (
                <span className="text-muted-foreground flex-1 text-sm">Base currency</span>
              ) : (
                <label className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
                  <span className="shrink-0">1 {base} =</span>
                  <NumberField
                    aria-label={`${c.code} per ${base}`}
                    min="0"
                    step="any"
                    value={c.unitsPerBase}
                    onCommit={(unitsPerBase) => dispatch({ type: 'currency/updateRate', code: c.code, unitsPerBase })}
                  />
                </label>
              )}
              {c.code !== base && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${c.code}`}
                  title={used ? 'Saved expenses keep their converted amount' : undefined}
                  onClick={() => dispatch({ type: 'currency/remove', code: c.code })}
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleAdd} className="bg-muted/50 space-y-2 rounded-lg border p-3" noValidate>
        <span className="text-sm font-medium">Add currency</span>
        <div className="grid grid-cols-[5.5rem_1fr] gap-2">
          <Input
            aria-label="Currency code"
            placeholder="USD"
            maxLength={3}
            className="uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Input
            aria-label={`Units per 1 ${base}`}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={`How many per 1 ${base}`}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="secondary" className="w-full">
          <Plus />
          Add currency
        </Button>
      </form>
    </div>
  )
}
