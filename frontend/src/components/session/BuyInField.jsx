import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BuyInField({
  playerId,
  playerName,
  currencySymbol,
  value,
  onChange,
  onClear,
  onSubmit,
  disabled = false,
  isPending = false,
  compact = false,
}) {
  const hasValue = Boolean(value)

  return (
    <div className={compact ? "space-y-2 border-t border-border/30 pt-3" : "space-y-2"}>
      <Label className="block text-xs text-muted-foreground">
        {compact ? "Add rebuy" : "Add buy-in"}{" "}
        <span className="text-muted-foreground/70">(adds to current total)</span>
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="pl-8 pr-10"
          />
          {hasValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={onClear}
              aria-label={`Clear buy-in amount for ${playerName}`}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 px-4"
          onClick={onSubmit}
          disabled={disabled || !parseFloat(value) || isPending}
        >
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </div>
    </div>
  )
}
