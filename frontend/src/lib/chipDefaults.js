export const CHIP_DEFAULTS_STORAGE_KEY = "poker-ledger:chip-defaults"

export const FACTORY_CHIP_VALUES = ["0.25", "1", "5", "25"]

export function loadChipDefaultValues() {
  try {
    const raw = localStorage.getItem(CHIP_DEFAULTS_STORAGE_KEY)
    if (!raw) return [...FACTORY_CHIP_VALUES]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [...FACTORY_CHIP_VALUES]
    return parsed.map(v => String(v)).filter(v => v !== "")
  } catch {
    return [...FACTORY_CHIP_VALUES]
  }
}

export function saveChipDefaultValues(values) {
  localStorage.setItem(CHIP_DEFAULTS_STORAGE_KEY, JSON.stringify(values))
}

export function valuesToCalculatorRows(values) {
  return values.map((value, index) => ({
    id: `default-${index}`,
    value: String(value),
    count: "0",
  }))
}
