import 'i18next'
import type { Resources } from './locales/en'

// Type-safe keys: t('summary.pace') is checked at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Resources }
  }
}
