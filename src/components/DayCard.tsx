import { useState } from 'react'
import { ChevronDown, Hand, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BudgetBar } from './BudgetBar'
import { SwipeableRow } from './SwipeableRow'
import type { DaySummary } from '../domain/budget'
import { useI18n } from '../i18n'
import type { Expense } from '../domain/types'
import { cn } from '@/lib/utils'

interface Props {
  day: DaySummary
  baseCurrency: string
  isToday: boolean
  openRowId: string | null
  onOpenRowChange: (id: string | null) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  /** Show the "swipe left to edit" hint on this card's first expense. */
  showHint: boolean
  onDismissHint: () => void
}

export function DayCard({ day, baseCurrency, isToday, openRowId, onOpenRowChange, onEdit, onDelete, showHint, onDismissHint }: Props) {
  const [expanded, setExpanded] = useState(isToday)
  const { t, day: formatDay, money: formatMoney } = useI18n()
  const money = (n: number) => formatMoney(n, baseCurrency)

  return (
    <Card className={cn('gap-0 py-0', isToday && 'ring-primary/40 ring-2')} data-tour={isToday ? 'days' : undefined}>
      <button
        type="button"
        className="w-full space-y-2 px-4 py-3 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{day.place}</p>
            <p className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums">
              {formatDay(day.date)}
              {isToday && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {t('days.today')}
                </Badge>
              )}
            </p>
          </div>
          <span className="shrink-0 text-sm tabular-nums">
            {money(day.spent)} <span className="text-muted-foreground">/ {money(day.budget)}</span>
          </span>
          <ChevronDown className={cn('text-muted-foreground size-4 shrink-0 transition-transform', expanded && 'rotate-180')} />
        </div>
        <BudgetBar spent={day.spent} budget={day.budget} label={t('days.spendingOn', { place: day.place })} />
      </button>

      {expanded && (
        <div className="space-y-1 border-t px-2 py-2">
          {day.expenses.length === 0 && <p className="text-muted-foreground px-2 py-1 text-sm">{t('days.empty')}</p>}
          {day.expenses.map((e, i) => (
            <div key={e.id} className="relative">
              {showHint && i === 0 && <SwipeHint onDismiss={onDismissHint} />}
              <SwipeableRow
                labels={{
                  edit: t('days.editItem', { label: e.note || t(`category.${e.category}`) }),
                  delete: t('days.deleteItem', { label: e.note || t(`category.${e.category}`) }),
                  editAction: t('days.editAction'),
                  deleteAction: t('days.deleteAction'),
                }}
                open={openRowId === e.id}
                onOpenChange={(open) => {
                  onOpenRowChange(open ? e.id : null)
                  if (open) onDismissHint()
                }}
                onEdit={() => onEdit(e)}
                onDelete={() => onDelete(e)}
              >
                <div className={cn('flex items-center gap-3 px-2 py-2', showHint && i === 0 && 'animate-hint-nudge')}>
                  <Badge variant="outline" className={cn(e.category === 'Emergency' && 'text-destructive')}>
                    {t(`category.${e.category}`)}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm">{e.note}</span>
                  <span className="text-right text-sm tabular-nums">
                    {money(e.amountBase)}
                    {e.currency !== baseCurrency && (
                      <span className="text-muted-foreground block text-xs">
                        {e.amount} {e.currency}
                      </span>
                    )}
                  </span>
                </div>
              </SwipeableRow>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/** Tooltip-style bubble shown until the user swipes a row for the first time. */
function SwipeHint({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n()
  return (
    <div
      role="note"
      className="bg-primary text-primary-foreground absolute -top-7 right-2 z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md"
    >
      <Hand className="size-3.5" />
      {t('days.swipeHint')}
      <button type="button" aria-label={t('days.dismissHint')} className="opacity-70 hover:opacity-100" onClick={onDismiss}>
        <X className="size-3.5" />
      </button>
      <span className="bg-primary absolute -bottom-1 right-6 size-2 rotate-45" aria-hidden />
    </div>
  )
}
