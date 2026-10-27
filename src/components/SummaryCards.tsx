import { CalendarDays, LifeBuoy, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BudgetBar } from './BudgetBar'
import { fromBase, type TripSummary } from '../domain/budget'
import { formatReference } from '../domain/format'
import { useI18n } from '../i18n'
import type { Trip } from '../domain/types'
import { cn } from '@/lib/utils'

interface Props {
  summary: TripSummary
  trip: Trip
}

export function SummaryCards({ summary, trip }: Props) {
  const { today, carryOver, availableToday, tripRemaining, pace, cushionRemaining } = summary
  const { t, locale, day, money: formatMoney } = useI18n()
  const base = trip.baseCurrency
  const money = (n: number) => formatMoney(n, base)
  const reference = (n: number) =>
    trip.homeCurrency !== base
      ? formatReference(fromBase(n, trip.homeCurrency, trip.currencies), trip.homeCurrency, locale)
      : null

  return (
    <section aria-label={t('summary.label')} className="grid grid-cols-2 gap-3">
      <Card className="col-span-2 gap-3" data-tour="today">
        <CardContent className="space-y-3">
          <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {t('summary.today', { date: day(today.date) })}
            </span>
            <span className="truncate">{today.place}</span>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums" data-testid="available-today">
              {money(availableToday)}
            </p>
            <p className="text-muted-foreground text-sm">{t('summary.availableToday')}</p>
          </div>
          <BudgetBar spent={today.spent} budget={Math.max(today.budget + carryOver, 0.01)} label={t('summary.todaySpending')} />
          <p className="text-muted-foreground text-xs tabular-nums">
            {t('summary.base', { amount: money(today.budget) })}
            {carryOver > 0 && t('summary.saved', { amount: money(carryOver) })}
            {carryOver < 0 && t('summary.owed', { amount: money(-carryOver) })}
            {t('summary.spent', { amount: money(today.spent) })}
          </p>
        </CardContent>
      </Card>

      <div className="col-span-2 grid grid-cols-2 gap-3" data-tour="stats">
      <Stat icon={<Wallet className="size-3.5" />} label={t('summary.leftForTrip')} testId="trip-remaining" value={money(tripRemaining)} sub={reference(tripRemaining)} />

      <Stat
        icon={pace >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
        label={t('summary.pace')}
        testId="pace"
        value={`${pace >= 0 ? '+' : ''}${money(pace)}`}
        valueClassName={pace >= 0 ? 'text-success' : 'text-destructive'}
        sub={pace >= 0 ? t('summary.underPlan') : t('summary.overPlan')}
      />

      <Stat
        className="col-span-2"
        icon={<LifeBuoy className="size-3.5" />}
        label={t('summary.cushion')}
        testId="cushion"
        value={t('summary.cushionValue', { left: money(cushionRemaining), total: money(trip.emergencyCushion) })}
        sub={reference(cushionRemaining)}
      />
      </div>
    </section>
  )
}

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
  testId: string
  sub?: string | null
  className?: string
  valueClassName?: string
}

function Stat({ icon, label, value, testId, sub, className, valueClassName }: StatProps) {
  return (
    <Card className={cn('gap-1 py-3', className)}>
      <CardContent className="space-y-1">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          {icon}
          {label}
        </p>
        <p className={cn('text-lg font-semibold tabular-nums', valueClassName)} data-testid={testId}>
          {value}
        </p>
        {sub && <p className="text-muted-foreground text-xs tabular-nums">{sub}</p>}
      </CardContent>
    </Card>
  )
}
