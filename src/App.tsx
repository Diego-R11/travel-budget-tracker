import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DayCard } from './components/DayCard'
import { ExpenseForm } from './components/ExpenseForm'
import { SettingsSheet } from './components/settings/SettingsSheet'
import { SummaryCards } from './components/SummaryCards'
import { currentDay, startsSection, summarizeTrip } from './domain/budget'
import { draftToExpense } from './domain/expenses'
import { formatMoney, todayIso as getTodayIso } from './domain/format'
import type { Expense } from './domain/types'
import type { AppState } from './state/appReducer'
import { useTripStore } from './state/useTripStore'

const HINT_KEY = 'travel-budget:swipe-hint-seen'

interface Props {
  /** Injectable state and "today" so the app can be tested on any date. */
  initialState?: AppState
  today?: string
}

export default function App({ initialState, today = getTodayIso() }: Props) {
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{trip.name || 'My trip'}</h1>
          <p className="text-muted-foreground text-sm">Daily budget with carry-over</p>
        </div>
        <SettingsSheet trip={trip} expenses={expenses} dispatch={dispatch} />
      </header>

      <SummaryCards summary={summary} trip={trip} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            Add expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            key={todayId}
            trip={trip}
            initial={{ dayId: todayId }}
            submitLabel="Save expense"
            onSubmit={(draft) =>
              dispatch({
                type: 'expense/add',
                expense: draftToExpense(draft, trip, { id: crypto.randomUUID(), createdAt: Date.now() }),
              })
            }
          />
        </CardContent>
      </Card>

      <section aria-label="Trip days" className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Budget per day</h2>
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
        <p className="text-muted-foreground pt-2 text-xs">
          Whatever you don't spend one day rolls over to the next. Expenses tagged Emergency come out of the cushion.
        </p>
      </section>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
            <DialogDescription>It's converted again with the current exchange rate.</DialogDescription>
          </DialogHeader>
          {editing && (
            <ExpenseForm
              idPrefix="edit"
              trip={trip}
              initial={editing}
              submitLabel="Save changes"
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
          <span>Deleted {formatMoney(lastDeleted.amountBase, trip.baseCurrency)}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              dispatch({ type: 'expense/add', expense: lastDeleted })
              setLastDeleted(null)
            }}
          >
            Undo
          </Button>
        </div>
      )}
    </main>
  )
}
