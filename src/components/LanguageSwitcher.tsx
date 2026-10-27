import { useI18n, type Language } from '../i18n'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

/** Segmented EN / ES control. The choice is remembered by i18next's detector. */
export function LanguageSwitcher() {
  const { t, language, setLanguage } = useI18n()
  return (
    <div role="group" aria-label={t('app.language')} className="bg-muted inline-flex h-9 rounded-md p-[3px]" data-tour="language">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          aria-pressed={language === o.value}
          onClick={() => setLanguage(o.value)}
          className={cn(
            'text-muted-foreground rounded-sm px-2.5 text-xs font-semibold transition-colors',
            language === o.value && 'bg-background text-foreground shadow-sm',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
