import { useState, type FormEvent } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { useLiveRates } from '../../api/useLiveRates'
import { formatDateTime } from '../../domain/format'
import { applyLiveRates, normalizeCode, validateCurrency } from '../../domain/tripSettings'
import type { Expense, Trip } from '../../domain/types'
import { useI18n } from '../../i18n'
import type { AppAction } from '../../state/appReducer'
import { NumberField } from './NumberField'

interface Props {
  trip: Trip
  expenses: Expense[]
  dispatch: (a: AppAction) => void
}

export function CurrenciesSettings({ trip, dispatch }: Props) {
  const { t } = useI18n()
  const base = trip.baseCurrency

  return (
    <div className="space-y-5 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="base-currency">{t('settings.baseCurrency')}</Label>
          <NativeSelect
            id="base-currency"
            value={base}
            onChange={(e) => dispatch({ type: 'currency/changeBase', code: e.target.value })}
          >
            {trip.currencies.map((c) => (
              <option key={c.code}>{c.code}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home-currency">{t('settings.homeCurrency')}</Label>
          <NativeSelect
            id="home-currency"
            value={trip.homeCurrency}
            onChange={(e) => dispatch({ type: 'trip/update', changes: { homeCurrency: e.target.value } })}
          >
            {trip.currencies.map((c) => (
              <option key={c.code}>{c.code}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <p className="text-muted-foreground -mt-3 text-xs">{t('settings.baseHelp')}</p>

      <LiveRatesPanel trip={trip} dispatch={dispatch} />

      <ul className="space-y-2" aria-label={t('settings.currencies')}>
        {trip.currencies.map((c) => {
          return (
            <li key={c.code} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Badge variant={c.code === base ? 'default' : 'secondary'} className="w-12">
                {c.code}
              </Badge>
              {c.code === base ? (
                <span className="text-muted-foreground flex-1 text-sm">{t('settings.isBase')}</span>
              ) : (
                <label className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
                  <span className="shrink-0">1 {base} =</span>
                  <NumberField
                    aria-label={t('settings.rateLabel', { code: c.code, base })}
                    min="0"
                    step="any"
                    value={c.unitsPerBase}
                    onCommit={(unitsPerBase) => dispatch({ type: 'currency/updateRate', code: c.code, unitsPerBase })}
                  />
                </label>
              )}
              {c.code !== base && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t('settings.removeCurrency', { code: c.code })}
                  onClick={() => dispatch({ type: 'currency/remove', code: c.code })}
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <AddCurrencyForm trip={trip} dispatch={dispatch} />
    </div>
  )
}

/** Fetch rates on demand, toggle auto-update, and show when the rates are from. */
function LiveRatesPanel({ trip, dispatch }: { trip: Trip; dispatch: (a: AppAction) => void }) {
  const { t, locale } = useI18n()
  const query = useLiveRates(trip.baseCurrency, false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function refresh() {
    setMessage(null)
    const result = await query.refetch()
    if (!result.data) {
      setMessage({ tone: 'error', text: t('rates.error') })
      return
    }
    const { updated, missing } = applyLiveRates(trip, result.data)
    dispatch({ type: 'currency/applyLive', rates: result.data })
    const parts = [t('rates.applied', { count: updated.length })]
    if (missing.length) parts.push(t('rates.missing', { codes: missing.join(', ') }))
    setMessage({ tone: 'ok', text: parts.join(' ') })
  }

  return (
    <section className="bg-muted/50 space-y-3 rounded-lg border p-3" aria-label={t('rates.title')}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{t('rates.title')}</p>
          <p className="text-muted-foreground text-xs" data-testid="rates-updated">
            {trip.ratesUpdatedAt ? t('rates.updatedAt', { date: formatDateTime(trip.ratesUpdatedAt, locale) }) : t('rates.neverUpdated')}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={refresh} disabled={query.isFetching}>
          <RefreshCw className={query.isFetching ? 'animate-spin' : undefined} />
          {query.isFetching ? t('rates.updating') : t('rates.update')}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="auto-rates" className="text-sm font-normal">
          {t('rates.auto')}
        </Label>
        <Switch
          id="auto-rates"
          checked={trip.autoUpdateRates}
          onCheckedChange={(autoUpdateRates) => dispatch({ type: 'trip/update', changes: { autoUpdateRates } })}
        />
      </div>

      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={message.tone === 'error' ? 'text-destructive text-xs' : 'text-xs'}>
          {message.text}
        </p>
      )}

      <p className="text-muted-foreground text-xs">
        {t('rates.daily')}{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          {t('rates.attribution')}
        </a>
      </p>
    </section>
  )
}

/** New currency: the rate is suggested from the live rates when the provider has it. */
function AddCurrencyForm({ trip, dispatch }: { trip: Trip; dispatch: (a: AppAction) => void }) {
  const { t, locale } = useI18n()
  const base = trip.baseCurrency
  const [code, setCode] = useState('')
  const [rate, setRate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const normalized = normalizeCode(code)
  const live = useLiveRates(base, normalized.length === 3)
  const suggested = normalized.length === 3 ? live.data?.rates[normalized] : undefined

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const problem = validateCurrency(trip, code, Number(rate))
    if (problem) return setError(t(`settings.errors.${problem}`))
    dispatch({ type: 'currency/add', code, unitsPerBase: Number(rate) })
    setCode('')
    setRate('')
    setError(null)
  }

  return (
    <form onSubmit={handleAdd} className="bg-muted/50 space-y-2 rounded-lg border p-3" noValidate>
      <span className="text-sm font-medium">{t('settings.addCurrency')}</span>
      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
        <Input
          aria-label={t('settings.currencyCode')}
          placeholder="USD"
          maxLength={3}
          className="uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          aria-label={t('settings.unitsPer', { base })}
          type="number"
          inputMode="decimal"
          step="any"
          placeholder={t('settings.unitsPerPlaceholder', { base })}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
      </div>
      {suggested !== undefined && String(suggested) !== rate && (
        <div className="flex items-center justify-between gap-2 text-xs" data-testid="rate-suggestion">
          <span className="text-muted-foreground">
            {t('rates.suggestion', { base, code: normalized, rate: suggested.toLocaleString(locale, { maximumFractionDigits: 6 }) })}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => setRate(String(suggested))}>
            {t('rates.useSuggestion')}
          </Button>
        </div>
      )}
      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" className="w-full">
        <Plus />
        {t('settings.addCurrency')}
      </Button>
    </form>
  )
}
