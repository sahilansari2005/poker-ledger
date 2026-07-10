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
    <div className="page-stack ui-scroll-surface">
      <PageHeader
        title="Chip calculator"
        subtitle="Enter denominations and counts to total your stack."
        action={
          <Link to="/settings" aria-label="Calculator settings">
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </Link>
        }
      />

      <Card className="border-primary/20 bg-primary/8">
        <CardContent className="space-y-1 py-8 text-center">
          <p className="text-caption">Total value</p>
          <p className="text-title text-primary tabular-nums">
            {formatMoney(total, currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Your chips</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="size-4 text-primary" /> Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBreakdown.map((r) => (
              <div
                key={r.id}
                className="flex justify-between border-b border-border/40 py-3 text-base last:border-0"
              >
                <span className="text-caption">
                  {r.count} × {formatMoney(r.value, currency)}
                </span>
                <span className="font-medium tabular-nums">{formatMoney(r.subtotal, currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
