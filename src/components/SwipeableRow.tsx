import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTIONS_WIDTH, resolveSwipe } from '../domain/swipe'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
  label: string
  children: ReactNode
}

/**
 * iOS-style row: swipe left to reveal Edit and Delete. Vertical scrolling still works
 * (touch-action: pan-y). Keyboard users can tab to the actions, which opens the row.
 */
export function SwipeableRow({ open, onOpenChange, onEdit, onDelete, label, children }: Props) {
  const start = useRef<{ x: number; offset: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const offset = dragOffset ?? (open ? -ACTIONS_WIDTH : 0)

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, offset: open ? -ACTIONS_WIDTH : 0 }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    if (dragOffset === null && Math.abs(dx) < 6) return // ignore taps and tiny jitters
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragOffset(Math.min(0, Math.max(-ACTIONS_WIDTH - 24, start.current.offset + dx)))
  }

  function onPointerUp() {
    if (dragOffset !== null) onOpenChange(resolveSwipe(dragOffset) === 'open')
    else if (open) onOpenChange(false) // tapping an open row closes it
    start.current = null
    setDragOffset(null)
  }

  return (
    <div className="relative overflow-hidden rounded-md" data-testid="swipe-row" data-open={open}>
      {/* Hidden while closed so the action colours never peek through the rounded edges. */}
      <div
        className={cn('absolute inset-y-0 right-0 flex transition-opacity', offset === 0 ? 'opacity-0' : 'opacity-100')}
        style={{ width: ACTIONS_WIDTH }}
      >
        <button
          type="button"
          className="bg-secondary text-secondary-foreground flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium"
          onFocus={() => onOpenChange(true)}
          onClick={onEdit}
          aria-label={`Edit ${label}`}
        >
          <Pencil className="size-4" />
          Edit
        </button>
        <button
          type="button"
          className="bg-destructive flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-white"
          onFocus={() => onOpenChange(true)}
          onClick={onDelete}
          aria-label={`Delete ${label}`}
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </div>
      <div
        className={cn('bg-card relative touch-pan-y select-none', dragOffset === null && 'transition-transform duration-200')}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  )
}
