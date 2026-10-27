import { Progress } from '@/components/ui/progress'
import { barStatus } from '../domain/budget'

const COLORS = { ok: 'bg-success', warn: 'bg-warning', over: 'bg-destructive' } as const

export function BudgetBar({ spent, budget, label }: { spent: number; budget: number; label: string }) {
  const { percent, status } = barStatus(spent, budget)
  return <Progress value={percent} aria-label={label} data-status={status} indicatorClassName={COLORS[status]} />
}
