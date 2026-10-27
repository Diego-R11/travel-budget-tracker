import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: number
  /** Called only with valid positive numbers, so the state never holds NaN or 0. */
  onCommit: (value: number) => void
  allowZero?: boolean
}

/**
 * Numeric input that keeps the user's raw text while typing ("", "3.") and only
 * commits valid values. If the value changes from outside, the text follows it.
 */
export function NumberField({ value, onCommit, allowZero = false, ...props }: Props) {
  const [text, setText] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)

  // The value changed from outside (e.g. live rates arrived): show it, unless it's what the user typed.
  if (value !== prevValue) {
    setPrevValue(value)
    if (Number(text) !== value) setText(String(value))
  }

  const isValid = (n: number) => Number.isFinite(n) && (allowZero ? n >= 0 : n > 0)

  return (
    <Input
      type="number"
      inputMode="decimal"
      className="tabular-nums"
      {...props}
      value={text}
      aria-invalid={!isValid(Number(text)) || text === ''}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value !== '' && isValid(n)) onCommit(n)
      }}
      onBlur={() => setText(String(value))}
    />
  )
}
