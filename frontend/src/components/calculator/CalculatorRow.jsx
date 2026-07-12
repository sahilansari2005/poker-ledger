import { memo } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/currency"

const CalculatorRow = memo(function CalculatorRow({
  id,
  value,
  count,
  subtotal,
  currency,
  currencySymbol,
  canRemove,
  onUpdate,
  onRemove,
}) {
  const countNum = parseInt(count, 10) || 0

  const adjustCount = (delta) => {
    const next = Math.max(0, countNum + delta)
    onUpdate(id, "count", String(next))
  }

  return (
    <div className="space-y-4 border-b border-border/40 py-5 last:border-0 last:pb-0 first:pt-0">
      <div className="space-y-2">
        <Label className="text-caption">Value ({currencySymbol})</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onUpdate(id, "value", e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-caption">Count</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            aria-label="Decrease count"
            disabled={countNum <= 0}
            onClick={() => adjustCount(-1)}
            className="size-14 min-h-14 min-w-14 shrink-0 rounded-2xl [&_svg:not([class*='size-'])]:size-6"
          >
            <Minus />
          </Button>
          <div
            className="flex h-14 min-h-14 flex-1 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-2xl font-semibold tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {countNum}
          </div>
          <Button
            type="button"
            variant="outline"
            aria-label="Increase count"
            onClick={() => adjustCount(1)}
            className="size-14 min-h-14 min-w-14 shrink-0 rounded-2xl [&_svg:not([class*='size-'])]:size-6"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="tabular-nums">
          {formatMoney(subtotal, currency)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onRemove(id)}
          disabled={!canRemove}
        >
          <Trash2 className="size-4" /> Remove
        </Button>
      </div>
    </div>
  )
})

export default CalculatorRow
