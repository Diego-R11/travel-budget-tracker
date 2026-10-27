import type { TripSummary } from '../domain/budget'
import { formatCop, formatDay, formatEur } from '../domain/format'
import { ProgressBar } from './ProgressBar'

interface Props {
  summary: TripSummary
  cushion: number
  copPerEur: number
}

export function SummaryTiles({ summary, cushion, copPerEur }: Props) {
  const { today, carryOver, availableToday, tripRemaining, pace, cushionRemaining } = summary
  const totalAvailable = today.budget + carryOver

  let carryText = ''
  if (carryOver > 0) carryText = ` + ${formatEur(carryOver)} saved`
  if (carryOver < 0) carryText = ` − ${formatEur(-carryOver)} from previous days`

  return (
    <section className="summary" aria-label="Summary">
      <div className="tile tile--today">
        <div className="tile__row">
          <span className="label">Today · {formatDay(today.date)}</span>
          <span className="num">{today.place}</span>
        </div>
        <div className="tile__row">
          <span className="big" data-testid="available-today">
            {formatEur(availableToday)} available
          </span>
          <span className="muted num">
            Base {formatEur(today.budget)}
            {carryText} · spent {formatEur(today.spent)}
          </span>
        </div>
        <ProgressBar spent={today.spent} budget={Math.max(totalAvailable, 0.01)} label="Today's spending" />
      </div>

      <div className="tile">
        <span className="label">Left for the trip</span>
        <span className="big" data-testid="trip-remaining">{formatEur(tripRemaining)}</span>
        <span className="muted num">{formatCop(tripRemaining, copPerEur)}</span>
      </div>

      <div className="tile">
        <span className="label">Pace</span>
        <span className={`big ${pace >= 0 ? 'good' : 'bad'}`} data-testid="pace">
          {pace >= 0 ? '+' : ''}
          {formatEur(pace)}
        </span>
        <span className="muted">{pace >= 0 ? 'under plan' : 'over plan'}</span>
      </div>

      <div className="tile tile--wide">
        <span className="label">Emergency cushion</span>
        <div className="tile__row">
          <span className="big" data-testid="cushion">
            {formatEur(cushionRemaining)} of {formatEur(cushion)}
          </span>
          <span className="muted num">{formatCop(cushionRemaining, copPerEur)}</span>
        </div>
      </div>
    </section>
  )
}
