import { memo } from "react"
import { Trash2 } from "lucide-react"
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
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Value ({currencySymbol})</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Count</Label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={count}
            onChange={(e) => onUpdate(id, "count", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm font-bold tabular-nums">
          {formatMoney(subtotal, currency)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 text-destructive hover:text-destructive"
          onClick={() => onRemove(id)}
          disabled={!canRemove}
        >
          <Trash2 className="mr-1 size-4" /> Remove
        </Button>
      </div>
    </div>
  )
})

export default CalculatorRow
