import type { Trip } from '../domain/types'

/** Sample trip: 17 days across Spain, France, Switzerland and Italy. */
export const europeTrip: Trip = {
  name: 'Europe 2026',
  emergencyCushion: 135,
  sections: {
    '2026-10-18': 'Spain',
    '2026-10-21': 'France',
    '2026-10-23': 'Switzerland',
    '2026-10-25': 'Italy',
    '2026-11-02': 'Way back',
  },
  days: [
    { date: '2026-10-18', place: 'Madrid', budget: 45 },
    { date: '2026-10-19', place: 'Madrid', budget: 45 },
    { date: '2026-10-20', place: 'Madrid → Paris', budget: 45 },
    { date: '2026-10-21', place: 'Paris', budget: 55 },
    { date: '2026-10-22', place: 'Paris → Interlaken', budget: 60 },
    { date: '2026-10-23', place: 'Jungfraujoch', budget: 75 },
    { date: '2026-10-24', place: 'Interlaken → Milan', budget: 55 },
    { date: '2026-10-25', place: 'Milan → Venice', budget: 50 },
    { date: '2026-10-26', place: 'Venice → Florence', budget: 55 },
    { date: '2026-10-27', place: 'Pisa & Florence', budget: 45 },
    { date: '2026-10-28', place: 'Florence → Salerno', budget: 45 },
    { date: '2026-10-29', place: 'Amalfi Coast', budget: 60 },
    { date: '2026-10-30', place: 'Salerno → Rome', budget: 45 },
    { date: '2026-10-31', place: 'Rome', budget: 50 },
    { date: '2026-11-01', place: 'Rome', budget: 45 },
    { date: '2026-11-02', place: 'Rome → Madrid', budget: 35 },
    { date: '2026-11-03', place: 'Madrid → Bogotá', budget: 15 },
  ],
}
