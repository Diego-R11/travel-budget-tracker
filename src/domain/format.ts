const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', COP: '$', JPY: '¥', MXN: '$' }

const round = (n: number) => Math.round(n * 100) / 100

/** Compact money format: "€12.50", "−€3", "CHF 10". Unknown codes are written as "ABC 10". */
export function formatMoney(value: number, code: string, maxDecimals = 2): string {
  const decimals = Number.isInteger(round(value)) ? 0 : maxDecimals
  const abs = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: maxDecimals })
  const symbol = SYMBOLS[code] ?? `${code} `
  return `${value < 0 ? '−' : ''}${symbol}${abs}`
}

/** Reference amount in the home currency, rounded: "2.945.550 COP", "≈ 812 USD". */
export function formatReference(value: number, code: string): string {
  const locale = code === 'COP' ? 'es-CO' : 'en-US'
  return `${value < 0 ? '−' : ''}${Math.round(Math.abs(value)).toLocaleString(locale)} ${code}`
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
