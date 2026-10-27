import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next, useTranslation } from 'react-i18next'
import { formatDay, formatMoney } from '../domain/format'
import { en } from './locales/en'
import { es } from './locales/es'

export const LANGUAGES = ['en', 'es'] as const
export type Language = (typeof LANGUAGES)[number]

/** Locale used for numbers and dates: Spanish uses Colombian formatting (1.234,56). */
export const LOCALES: Record<Language, string> = { en: 'en-US', es: 'es-CO' }

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es } },
    supportedLngs: LANGUAGES,
    nonExplicitSupportedLngs: true, // "es-CO" → "es"
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'travel-budget:language',
      caches: ['localStorage'],
    },
  })

export function currentLanguage(lng = i18n.resolvedLanguage): Language {
  return lng?.startsWith('es') ? 'es' : 'en'
}

/** Translation function plus locale-aware formatters for the active language. */
export function useI18n() {
  const { t, i18n: instance } = useTranslation()
  const language = currentLanguage(instance.resolvedLanguage)
  const locale = LOCALES[language]
  return {
    t,
    language,
    locale,
    setLanguage: (lng: Language) => instance.changeLanguage(lng),
    money: (value: number, code: string) => formatMoney(value, code, locale),
    day: (iso: string) => formatDay(iso, locale),
  }
}

export default i18n
