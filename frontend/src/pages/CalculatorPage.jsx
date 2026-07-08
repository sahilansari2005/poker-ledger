import { useCallback, useMemo, useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Plus, Coins, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/layout/PageHeader"
import CalculatorRow from "@/components/calculator/CalculatorRow"
import { valuesToCalculatorRows } from "@/lib/chipDefaults"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

let nextCustomId = 1

export default function CalculatorPage() {
  const location = useLocation()
  const { defaultCurrency, chipDefaultValues } = useUserPreferences()
  const [rows, setRows] = useState(() => valuesToCalculatorRows(chipDefaultValues))
  const [currency, setCurrency] = useState(defaultCurrency)

  useEffect(() => {
    if (location.pathname === "/calculator") {
      setRows(valuesToCalculatorRows(chipDefaultValues))
      setCurrency(defaultCurrency)
    }
  }, [location.pathname, chipDefaultValues, defaultCurrency])

  const currencySymbol = getCurrencySymbol(currency)

  const { total, breakdown, breakdownById } = useMemo(() => {
    let sum = 0
    const items = rows.map((row) => {
      const value = parseFloat(row.value) || 0
      const count = parseInt(row.count, 10) || 0
      const subtotal = value * count
      sum += subtotal
      return { ...row, value, count, subtotal }
    })
    const byId = new Map(items.map((item) => [item.id, item]))
    return { total: sum, breakdown: items, breakdownById: byId }
  }, [rows])

  const updateRow = useCallback((id, field, val) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)))
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: `custom-${nextCustomId++}`, value: "1", count: "0" }])
  }, [])

  const removeRow = useCallback((id) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const reset = useCallback(() => {
    setRows(valuesToCalculatorRows(chipDefaultValues))
  }, [chipDefaultValues])

  const activeBreakdown = useMemo(
    () => breakdown.filter((r) => r.count > 0),
    [breakdown]
  )

  return (
    <div className="space-y-5 ui-scroll-surface">
      <PageHeader
        title="Chip Calculator"
        subtitle="Enter denominations and counts to total your stack."
        action={
          <Link to="/settings" aria-label="Calculator settings">
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </Link>
        }
      />

      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Value</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums sm:text-5xl">
            {formatMoney(total, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Your Chips</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset} className="h-10">
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={addRow} className="h-10">
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => {
            const item = breakdownById.get(row.id)
            return (
              <CalculatorRow
                key={row.id}
                id={row.id}
                value={row.value}
                count={row.count}
                subtotal={item?.subtotal || 0}
                currency={currency}
                currencySymbol={currencySymbol}
                canRemove={rows.length > 1}
                onUpdate={updateRow}
                onRemove={removeRow}
              />
            )
          })}
        </CardContent>
      </Card>

      {activeBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="size-4 text-primary" /> Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeBreakdown.map((r) => (
              <div
                key={r.id}
                className="flex justify-between border-b border-border/20 py-2 text-sm last:border-0"
              >
                <span className="text-muted-foreground">
                  {r.count} × {formatMoney(r.value, currency)}
                </span>
                <span className="font-semibold tabular-nums">{formatMoney(r.subtotal, currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
