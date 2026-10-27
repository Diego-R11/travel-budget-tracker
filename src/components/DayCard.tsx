import { useEffect, useState } from 'react'
import type { DaySummary } from '../domain/budget'
import { formatDay, formatEur } from '../domain/format'
import { ProgressBar } from './ProgressBar'

interface Props {
  day: DaySummary
  isToday: boolean
  onRemove: (id: string) => void
}

export function DayCard({ day, isToday, onRemove }: Props) {
  return (
    <details className={`day ${isToday ? 'day--today' : ''}`} open={isToday}>
      <summary>
        <span className="date">{formatDay(day.date)}</span>
        <span className="place">{day.place}</span>
        <span className="amt num">
          {formatEur(day.spent)} / {formatEur(day.budget)}
        </span>
        <ProgressBar spent={day.spent} budget={day.budget} label={`Spending on ${day.place}`} />
      </summary>
      <div className="items">
        {day.expenses.length === 0 && <div className="muted">No expenses yet.</div>}
        {day.expenses.map((e) => (
          <div className="item" key={e.id}>
            <span className="what">
              <span className="tag">{e.category}</span> {e.note}
            </span>
            <span className="num">
              {formatEur(e.amountEur)}
              {e.currency !== 'EUR' && ` (${e.amount} ${e.currency})`}
            </span>
            <RemoveButton onConfirm={() => onRemove(e.id)} />
          </div>
        ))}
      </div>
    </details>
  )
}

/** Two-step delete: first tap arms the button, second tap within 3 s confirms. */
function RemoveButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])

  return (
    <button
      type="button"
      className={`del ${armed ? 'del--armed' : ''}`}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? 'Delete?' : 'Remove'}
    </button>
  )
}
