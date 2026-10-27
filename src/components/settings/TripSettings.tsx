import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AppAction } from '../../state/appReducer'
import type { Trip } from '../../domain/types'
import { NumberField } from './NumberField'
import { useI18n } from '../../i18n'

export function TripSettings({ trip, dispatch }: { trip: Trip; dispatch: (a: AppAction) => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="trip-name">{t('settings.tripName')}</Label>
        <Input
          id="trip-name"
          value={trip.name}
          onChange={(e) => dispatch({ type: 'trip/update', changes: { name: e.target.value } })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trip-cushion">{t('settings.cushion', { currency: trip.baseCurrency })}</Label>
        <NumberField
          id="trip-cushion"
          min="0"
          step="1"
          allowZero
          value={trip.emergencyCushion}
          onCommit={(emergencyCushion) => dispatch({ type: 'trip/update', changes: { emergencyCushion } })}
        />
        <p className="text-muted-foreground text-xs">
          {t('settings.cushionHelp')}
        </p>
      </div>
    </div>
  )
}
