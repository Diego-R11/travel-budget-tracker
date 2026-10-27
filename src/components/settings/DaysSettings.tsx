import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sortDays } from '../../domain/budget'
import { todayIso } from '../../domain/format'
import { useI18n } from '../../i18n'
import { duplicateDates } from '../../domain/tripSettings'
import type { Expense, Trip } from '../../domain/types'
import type { AppAction } from '../../state/appReducer'
import { NumberField } from './NumberField'

interface Props {
  trip: Trip
  expenses: Expense[]
  dispatch: (a: AppAction) => void
}

export function DaysSettings({ trip, expenses, dispatch }: Props) {
  const { t, money } = useI18n()
  const [bulkBudget, setBulkBudget] = useState(50)
  const [armedId, setArmedId] = useState<string | null>(null)
  const days = sortDays(trip.days)
  const dupes = duplicateDates(trip.days)
  const total = days.reduce((acc, d) => acc + d.budget, 0)

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
        <Label htmlFor="bulk-budget">{t('settings.sameBudget')}</Label>
        <div className="flex gap-2">
          <NumberField id="bulk-budget" min="0" value={bulkBudget} onCommit={setBulkBudget} />
          <Button type="button" variant="secondary" onClick={() => dispatch({ type: 'day/setAllBudgets', budget: bulkBudget })}>
            {t('settings.applyAll')}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          {t('settings.daysTotal', { count: days.length, total: money(total, trip.baseCurrency) })}
        </p>
      </div>

      <ul className="space-y-3" aria-label={t('days.label')}>
        {days.map((day, i) => {
          const count = expenses.filter((e) => e.dayId === day.id).length
          const armed = armedId === day.id
          return (
            <li key={day.id} className="space-y-2 rounded-lg border p-3" aria-label={t('settings.dayN', { n: i + 1 })}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">{t('settings.dayN', { n: i + 1 })}</span>
                <Button
                  type="button"
                  size="sm"
                  variant={armed ? 'destructive' : 'ghost'}
                  disabled={days.length === 1}
                  onClick={() => {
                    if (armed || count === 0) {
                      dispatch({ type: 'day/remove', id: day.id })
                      setArmedId(null)
                    } else setArmedId(day.id)
                  }}
                >
                  <Trash2 />
                  {armed ? t('settings.removeWithExpenses', { count }) : t('settings.remove')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('settings.date')} id={`day-${day.id}-date`}>
                  <Input
                    id={`day-${day.id}-date`}
                    type="date"
                    value={day.date}
                    aria-invalid={dupes.has(day.date)}
                    onChange={(e) => e.target.value && dispatch({ type: 'day/update', id: day.id, changes: { date: e.target.value } })}
                  />
                </Field>
                <Field label={t('settings.budget', { currency: trip.baseCurrency })} id={`day-${day.id}-budget`}>
                  <NumberField
                    id={`day-${day.id}-budget`}
                    min="0"
                    allowZero
                    value={day.budget}
                    onCommit={(budget) => dispatch({ type: 'day/update', id: day.id, changes: { budget } })}
                  />
                </Field>
                <Field label={t('settings.place')} id={`day-${day.id}-place`}>
                  <Input
                    id={`day-${day.id}-place`}
                    value={day.place}
                    onChange={(e) => dispatch({ type: 'day/update', id: day.id, changes: { place: e.target.value } })}
                  />
                </Field>
                <Field label={t('settings.country')} id={`day-${day.id}-country`}>
                  <Input
                    id={`day-${day.id}-country`}
                    value={day.country}
                    onChange={(e) => dispatch({ type: 'day/update', id: day.id, changes: { country: e.target.value } })}
                  />
                </Field>
              </div>
              {dupes.has(day.date) && <p className="text-destructive text-xs">{t('settings.duplicateDate')}</p>}
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          dispatch({
            type: 'day/add',
            id: crypto.randomUUID(),
            fallbackDate: todayIso(),
            labels: { place: t('settings.newPlace'), country: t('settings.newCountry') },
          })
        }
      >
        <Plus />
        {t('settings.addDay')}
      </Button>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-normal">
        {label}
      </Label>
      {children}
    </div>
  )
}
