import type { Trip } from '../domain/types'

const plan: [string, string, string, number][] = [
  ['2026-10-18', 'Madrid', 'Spain', 45],
  ['2026-10-19', 'Madrid', 'Spain', 45],
  ['2026-10-20', 'Madrid → Paris', 'Spain', 45],
  ['2026-10-21', 'Paris', 'France', 55],
  ['2026-10-22', 'Paris → Interlaken', 'France', 60],
  ['2026-10-23', 'Jungfraujoch', 'Switzerland', 75],
  ['2026-10-24', 'Interlaken → Milan', 'Switzerland', 55],
  ['2026-10-25', 'Milan → Venice', 'Italy', 50],
  ['2026-10-26', 'Venice → Florence', 'Italy', 55],
  ['2026-10-27', 'Pisa & Florence', 'Italy', 45],
  ['2026-10-28', 'Florence → Salerno', 'Italy', 45],
  ['2026-10-29', 'Amalfi Coast', 'Italy', 60],
  ['2026-10-30', 'Salerno → Rome', 'Italy', 45],
  ['2026-10-31', 'Rome', 'Italy', 50],
  ['2026-11-01', 'Rome', 'Italy', 45],
  ['2026-11-02', 'Rome → Madrid', 'Way back', 35],
  ['2026-11-03', 'Madrid → Bogotá', 'Way back', 15],
]

/** Sample trip used the first time the app opens. Everything is editable in Settings. */
export const sampleTrip: Trip = {
  name: 'Europe 2026',
  baseCurrency: 'EUR',
  homeCurrency: 'COP',
  currencies: [
    { code: 'EUR', unitsPerBase: 1 },
    { code: 'CHF', unitsPerBase: 0.93 },
    { code: 'COP', unitsPerBase: 3650 },
  ],
  emergencyCushion: 135,
  autoUpdateRates: true,
  days: plan.map(([date, place, country, budget]) => ({ id: `day-${date}`, date, place, country, budget })),
}
