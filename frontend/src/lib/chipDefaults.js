export const FACTORY_CHIP_VALUES = ["0.25", "1", "5", "25"]

export function valuesToCalculatorRows(values) {
  return values.map((value, index) => ({
    id: `default-${index}`,
    value: String(value),
    count: "0",
  }))
}
