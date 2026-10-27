import { barStatus } from '../domain/budget'

interface Props {
  spent: number
  budget: number
  label: string
}

export function ProgressBar({ spent, budget, label }: Props) {
  const { percent, status } = barStatus(spent, budget)
  return (
    <div
      className={`bar bar--${status}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <i style={{ width: `${percent}%` }} />
    </div>
  )
}
