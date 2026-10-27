import { useEffect, useMemo, useState } from 'react'
import { CircleHelp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLiveRates } from './api/useLiveRates'
import { DayCard } from './components/DayCard'
import { ExpenseForm } from './components/ExpenseForm'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { SettingsSheet } from './components/settings/SettingsSheet'
import { SummaryCards } from './components/SummaryCards'
import { currentDay, startsSection, summarizeTrip } from './domain/budget'
import { draftToExpense } from './domain/expenses'
import { todayIso as getTodayIso } from './domain/format'
import type { Expense } from './domain/types'
import { useI18n } from './i18n'
import type { AppState } from './state/appReducer'
import { useTripStore } from './state/useTripStore'
import { useTour } from './tour/useTour'

const HINT_KEY = 'travel-budget:swipe-hint-seen'

interface Props {
  /** Injectable state and "today" so the app can be tested on any date. */
  initialState?: AppState
  today?: string
  /** Start the guided tour on the first visit (disabled in tests). */
  autoStartTour?: boolean
}

export default function App({ initialState, today = getTodayIso(), autoStartTour = true }: Props) {
  const { t, money, language } = useI18n()
  const { trip, expenses, dispatch } = useTripStore(initialState)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [lastDeleted, setLastDeleted] = useState<Expense | null>(null)
  const [hintSeen, setHintSeen] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === '1'
    } catch {
      return false
    }
  })
  const tour = useTour({ autoStart: autoStartTour })

  // Live exchange rates: fetched when the app opens (if enabled) and applied to the trip.
  const liveRates = useLiveRates(trip.baseCurrency, trip.autoUpdateRates)
  useEffect(() => {
    if (liveRates.data) dispatch({ type: 'currency/applyLive', rates: liveRates.data })
  }, [liveRates.data, dispatch])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const summary = useMemo(() => summarizeTrip(trip, expenses, today), [trip, expenses, today])
  const todayId = currentDay(trip.days, today).id
  const firstDayWithExpenses = summary.days.find((d) => d.expenses.length > 0)?.id

  // The undo banner disappears after a few seconds.
  useEffect(() => {
    if (!lastDeleted) return
    const timer = setTimeout(() => setLastDeleted(null), 5000)
    return () => clearTimeout(timer)
  }, [lastDeleted])

  function dismissHint() {
    if (hintSeen) return
    setHintSeen(true)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // ignore
    }
  }

  function deleteExpense(expense: Expense) {
    dispatch({ type: 'expense/remove', id: expense.id })
    setOpenRowId(null)
    setLastDeleted(expense)
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-6 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{trip.name || t('app.defaultName')}</h1>
          <p className="text-muted-foreground text-sm">{t('app.tagline')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="icon" aria-label={t('app.help')} data-tour="help" onClick={tour.start}>
            <CircleHelp />
          </Button>
          <SettingsSheet trip={trip} expenses={expenses} dispatch={dispatch} />
        </div>
      </header>

      <SummaryCards summary={summary} trip={trip} />

      <Card data-tour="add">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            {t('expense.add')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            key={todayId}
            trip={trip}
            initial={{ dayId: todayId }}
            submitLabel={t('expense.save')}
            onSubmit={(draft) =>
              dispatch({
                type: 'expense/add',
                expense: draftToExpense(draft, trip, { id: crypto.randomUUID(), createdAt: Date.now() }),
              })
            }
          />
        </CardContent>
      </Card>

      <section aria-label={t('days.label')} className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t('days.title')}</h2>
        {summary.days.map((day, i) => (
          <div key={day.id} className="space-y-2">
            {startsSection(summary.days, i) && <h3 className="pt-3 text-sm font-semibold">{day.country}</h3>}
            <DayCard
              day={day}
              baseCurrency={trip.baseCurrency}
              isToday={day.id === todayId}
              openRowId={openRowId}
              onOpenRowChange={setOpenRowId}
              onEdit={(e) => {
                setEditing(e)
                setOpenRowId(null)
              }}
              onDelete={deleteExpense}
              showHint={!hintSeen && day.id === firstDayWithExpenses}
              onDismissHint={dismissHint}
            />
          </div>
        ))}
        <p className="text-muted-foreground pt-2 text-xs">{t('days.footnote')}</p>
      </section>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('expense.edit')}</DialogTitle>
            <DialogDescription>{t('expense.editDescription')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <ExpenseForm
              idPrefix="edit"
              trip={trip}
              initial={editing}
              submitLabel={t('expense.saveChanges')}
              onSubmit={(draft) => {
                dispatch({ type: 'expense/update', expense: draftToExpense(draft, trip, editing) })
                setEditing(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {lastDeleted && (
        <div
          role="status"
          className="bg-primary text-primary-foreground fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm shadow-lg"
        >
          <span>{t('expense.deleted', { amount: money(lastDeleted.amountBase, trip.baseCurrency) })}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              dispatch({ type: 'expense/add', expense: lastDeleted })
              setLastDeleted(null)
            }}
          >
            {t('expense.undo')}
          </Button>
        </div>
      )}
    </main>
  )
}
