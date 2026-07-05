export const CURRENCY_STORAGE_KEY = "poker-ledger:default-currency"

export const DEFAULT_CURRENCY = "GBP"

export const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
]

export const CURRENCY_CODES = CURRENCIES.map(c => c.code)

export function getCurrency(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)
}

export function getCurrencySymbol(code) {
  return getCurrency(code).symbol
}

export function loadDefaultCurrency() {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (!raw) return DEFAULT_CURRENCY
    return CURRENCY_CODES.includes(raw) ? raw : DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

export function saveDefaultCurrency(code) {
  localStorage.setItem(CURRENCY_STORAGE_KEY, code)
}

export function formatMoney(amount, currencyCode) {
  const currency = getCurrency(currencyCode || loadDefaultCurrency())
  const value = typeof amount === "number" ? amount : parseFloat(amount) || 0
  return `${currency.symbol}${value.toFixed(2)}`
}
