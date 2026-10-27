import { useCallback, useEffect, useRef } from 'react'
import { driver, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useI18n } from '../i18n'

export const TOUR_SEEN_KEY = 'travel-budget:tour-seen'

type StepKey = 'today' | 'stats' | 'add' | 'days' | 'settings' | 'language' | 'help'

/** Elements are marked with data-tour="…" so the tour doesn't depend on CSS classes. */
const STEPS: { key: StepKey; side: NonNullable<DriveStep['popover']>['side'] }[] = [
  { key: 'today', side: 'bottom' },
  { key: 'stats', side: 'bottom' },
  { key: 'add', side: 'top' },
  { key: 'days', side: 'top' },
  { key: 'settings', side: 'bottom' },
  { key: 'language', side: 'bottom' },
  { key: 'help', side: 'bottom' },
]

function markSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1')
  } catch {
    // ignore
  }
}

function hasSeen() {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === '1'
  } catch {
    return true // if storage is blocked, don't force the tour on every visit
  }
}

/**
 * Guided tour built on driver.js. Starts automatically on the first visit and
 * can be replayed from the help button. Texts follow the active language.
 */
export function useTour({ autoStart }: { autoStart: boolean }) {
  const { t } = useI18n()
  const instance = useRef<Driver | null>(null)

  const start = useCallback(() => {
    instance.current?.destroy()
    const steps: DriveStep[] = [
      { popover: { title: t('tour.welcome.title'), description: t('tour.welcome.text') } },
      ...STEPS.filter(({ key }) => document.querySelector(`[data-tour="${key}"]`)).map(({ key, side }) => ({
        element: `[data-tour="${key}"]`,
        popover: { title: t(`tour.${key}.title`), description: t(`tour.${key}.text`), side, align: 'start' as const },
      })),
    ]

    instance.current = driver({
      steps,
      showProgress: true,
      progressText: t('tour.progress', { current: '{{current}}', total: '{{total}}' }),
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.prev'),
      doneBtnText: t('tour.done'),
      popoverClass: 'tour-popover',
      stagePadding: 6,
      stageRadius: 12,
      smoothScroll: true,
      onDestroyed: markSeen,
    })
    instance.current.drive()
  }, [t])

  useEffect(() => {
    if (!autoStart || hasSeen()) return
    // Wait one frame so the layout is in place before measuring elements.
    const id = requestAnimationFrame(start)
    return () => cancelAnimationFrame(id)
  }, [autoStart, start])

  useEffect(() => () => instance.current?.destroy(), [])

  return { start }
}
