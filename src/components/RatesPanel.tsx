import type { Rates } from '../domain/types'

interface Props {
  rates: Rates
  onChange: (rates: Rates) => void
}

export function RatesPanel({ rates, onChange }: Props) {
  function update(field: keyof Rates, raw: string) {
    const value = Number(raw)
    if (value > 0) onChange({ ...rates, [field]: value })
  }

  return (
    <details className="rates">
      <summary>Exchange rates</summary>
      <div className="row">
        <label>
          COP per €
          <input
            className="num"
            type="number"
            step="1"
            defaultValue={rates.copPerEur}
            onChange={(e) => update('copPerEur', e.target.value)}
          />
        </label>
        <label>
          € per 1 CHF
          <input
            className="num"
            type="number"
            step="0.01"
            defaultValue={rates.eurPerChf}
            onChange={(e) => update('eurPerChf', e.target.value)}
          />
        </label>
      </div>
      <p className="muted small">
        Saved expenses keep the rate they were converted with. Adjust it if your card charges differently.
      </p>
    </details>
  )
}
