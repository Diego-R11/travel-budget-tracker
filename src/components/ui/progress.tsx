import * as React from 'react'
import { cn } from '@/lib/utils'

function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: React.ComponentProps<'div'> & { value?: number; indicatorClassName?: string }) {
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn('bg-primary/15 relative h-1.5 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn('bg-primary h-full rounded-full transition-all', indicatorClassName)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export { Progress }
