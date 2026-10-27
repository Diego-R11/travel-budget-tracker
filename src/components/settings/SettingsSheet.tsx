import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AppAction } from '../../state/appReducer'
import type { Expense, Trip } from '../../domain/types'
import { useI18n } from '../../i18n'
import { CurrenciesSettings } from './CurrenciesSettings'
import { DaysSettings } from './DaysSettings'
import { TripSettings } from './TripSettings'

interface Props {
  trip: Trip
  expenses: Expense[]
  dispatch: (action: AppAction) => void
}

export function SettingsSheet({ trip, expenses, dispatch }: Props) {
  const { t } = useI18n()
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('settings.open')} data-tour="settings">
          <Settings2 />
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0">
        <SheetHeader className="pb-4">
          <SheetTitle>{t('settings.title')}</SheetTitle>
          <SheetDescription>{t('settings.description')}</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="trip" className="min-h-0 flex-1 px-4">
          <TabsList>
            <TabsTrigger value="trip">{t('settings.tabTrip')}</TabsTrigger>
            <TabsTrigger value="days">{t('settings.tabDays')}</TabsTrigger>
            <TabsTrigger value="currencies">{t('settings.tabCurrencies')}</TabsTrigger>
          </TabsList>
          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <TabsContent value="trip">
              <TripSettings trip={trip} dispatch={dispatch} />
            </TabsContent>
            <TabsContent value="days">
              <DaysSettings trip={trip} expenses={expenses} dispatch={dispatch} />
            </TabsContent>
            <TabsContent value="currencies">
              <CurrenciesSettings trip={trip} expenses={expenses} dispatch={dispatch} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
