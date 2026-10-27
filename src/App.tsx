import { useMemo } from 'react'
import { DayCard } from './components/DayCard'
import { ExpenseForm } from './components/ExpenseForm'
import { RatesPanel } from './components/RatesPanel'
import { SummaryTiles } from './components/SummaryTiles'
import { europeTrip } from './data/trip'
import { clampToTrip, summarizeTrip } from './domain/budget'
import { todayIso as getTodayIso } from './domain/format'
import type { Rates, Trip } from './domain/types'
import { useExpenses } from './hooks/useExpenses'
import { useLocalStorage } from './hooks/useLocalStorage'

const DEFAULT_RATES: Rates = { copPerEur: 3650, eurPerChf: 1.07 }

interface Props {
  trip?: Trip
  /** Injectable "today" so the app can be tested on any date. */
  today?: string
}

export default function App({ trip = europeTrip, today = getTodayIso() }: Props) {
  const { expenses, addExpense, removeExpense } = useExpenses()
  const [rates, setRates] = useLocalStorage<Rates>('travel-budget:rates', DEFAULT_RATES)

  const summary = useMemo(() => summarizeTrip(trip, expenses, today), [trip, expenses, today])
  const currentDay = clampToTrip(today, trip.days)

  return (
    <main className="wrap">
      <header>
        <h1>{trip.name}</h1>
        <p className="muted">Daily travel budget with carry-over · food, local transport and activities</p>
      </header>

      <SummaryTiles summary={summary} cushion={trip.emergencyCushion} copPerEur={rates.copPerEur} />

      <ExpenseForm days={trip.days} defaultDate={currentDay} rates={rates} onAdd={addExpense} />

      <section aria-label="Trip days" className="days">
        <span className="label">Budget per day</span>
        {summary.days.map((day) => (
          <div key={day.date}>
            {trip.sections[day.date] && <h2 className="section">{trip.sections[day.date]}</h2>}
            <DayCard day={day} isToday={day.date === currentDay} onRemove={removeExpense} />
          </div>
        ))}
        <p className="muted small">
          Whatever you don't spend one day rolls over to the next. Expenses marked as Emergency come out of the
          cushion, not the daily budget.
        </p>
      </section>

      <RatesPanel rates={rates} onChange={setRates} />
    </main>
  )
}
