const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', COP: '$', JPY: '¥', MXN: '$' }

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Compact money format: "€12.50", "−€3", "CHF 10" (en-US) or "€12,50" (es-CO).
 * Unknown codes are written as "ABC 10".
 */
export function formatMoney(value: number, code: string, locale = 'en-US'): string {
  const decimals = Number.isInteger(round(value)) ? 0 : 2
  const abs = Math.abs(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: 2 })
  const symbol = SYMBOLS[code] ?? `${code} `
  return `${value < 0 ? '−' : ''}${symbol}${abs}`
}

/** Reference amount in the home currency, rounded: "2.945.550 COP". COP always uses Colombian grouping. */
export function formatReference(value: number, code: string, locale = 'en-US'): string {
  const groupLocale = code === 'COP' ? 'es-CO' : locale
  return `${value < 0 ? '−' : ''}${Math.round(Math.abs(value)).toLocaleString(groupLocale)} ${code}`
}

/** "Tue, Oct 27" in English, "mar, 27 oct" in Spanish. */
export function formatDay(iso: string, locale = 'en-US'): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateTime(timestamp: number, locale = 'en-US'): string {
  return new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
