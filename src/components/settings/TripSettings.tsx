import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AppAction } from '../../state/appReducer'
import type { Trip } from '../../domain/types'
import { NumberField } from './NumberField'

export function TripSettings({ trip, dispatch }: { trip: Trip; dispatch: (a: AppAction) => void }) {
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="trip-name">Trip name</Label>
        <Input
          id="trip-name"
          value={trip.name}
          onChange={(e) => dispatch({ type: 'trip/update', changes: { name: e.target.value } })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trip-cushion">Emergency cushion ({trip.baseCurrency})</Label>
        <NumberField
          id="trip-cushion"
          min="0"
          step="1"
          allowZero
          value={trip.emergencyCushion}
          onCommit={(emergencyCushion) => dispatch({ type: 'trip/update', changes: { emergencyCushion } })}
        />
        <p className="text-muted-foreground text-xs">
          Separate fund for unexpected costs. Expenses tagged “Emergency” come out of here, not from the daily budget.
        </p>
      </div>
    </div>
  )
}
