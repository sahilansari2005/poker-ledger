import { useMemo, useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Plus, Trash2, Coins, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/layout/PageHeader"
import {
  loadChipDefaultValues,
  valuesToCalculatorRows,
} from "@/lib/chipDefaults"
import { loadDefaultCurrency, formatMoney, getCurrencySymbol } from "@/lib/currency"

let nextCustomId = 1

export default function CalculatorPage() {
  const location = useLocation()
  const [rows, setRows] = useState(() => valuesToCalculatorRows(loadChipDefaultValues()))
  const [currency, setCurrency] = useState(() => loadDefaultCurrency())

  useEffect(() => {
    if (location.pathname === "/calculator") {
      setRows(valuesToCalculatorRows(loadChipDefaultValues()))
      setCurrency(loadDefaultCurrency())
    }
  }, [location.pathname])

  const currencySymbol = getCurrencySymbol(currency)

  const { total, breakdown } = useMemo(() => {
    let sum = 0
    const items = rows.map(row => {
      const value = parseFloat(row.value) || 0
      const count = parseInt(row.count, 10) || 0
      const subtotal = value * count
      sum += subtotal
      return { ...row, value, count, subtotal }
    })
    return { total: sum, breakdown: items }
  }, [rows])

  const updateRow = (id, field, val) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: val } : r)))
  }

  const addRow = () => {
    setRows(prev => [...prev, { id: `custom-${nextCustomId++}`, value: "1", count: "0" }])
  }

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const reset = () => setRows(valuesToCalculatorRows(loadChipDefaultValues()))

  return (
    <div className="space-y-5">
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

      <Card className="ui-card-hover border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Value</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary sm:text-5xl">{formatMoney(total, currency)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">Your Chips</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset} className="h-10">Reset</Button>
            <Button variant="outline" size="sm" onClick={addRow} className="h-10">
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map(row => {
            const item = breakdown.find(b => b.id === row.id)
            return (
              <div key={row.id} className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Value ({currencySymbol})</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={row.value}
                        onChange={e => updateRow(row.id, "value", e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Count</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={row.count}
                      onChange={e => updateRow(row.id, "count", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm font-bold tabular-nums">
                    {formatMoney(item?.subtotal || 0, currency)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 text-destructive hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="mr-1 size-4" /> Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {breakdown.some(r => r.count > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="size-4 text-primary" /> Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {breakdown.filter(r => r.count > 0).map(r => (
              <div key={r.id} className="flex justify-between border-b border-border/20 py-2 text-sm last:border-0">
                <span className="text-muted-foreground">{r.count} × {formatMoney(r.value, currency)}</span>
                <span className="font-semibold">{formatMoney(r.subtotal, currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
