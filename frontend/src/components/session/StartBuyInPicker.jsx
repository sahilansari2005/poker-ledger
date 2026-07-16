import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import MoneyInput from "@/components/ui/MoneyInput"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { cn } from "@/lib/utils"

/**
 * Per-player starting buy-in: A | B | Other.
 * A/B apply immediately; Other reveals a free-form amount + Add.
 */
export default function StartBuyInPicker({
  playerName,
  currency,
  optionA,
  optionB,
  selection,
  draftOther,
  onSelectPreset,
  onSelectOther,
  onDraftOtherChange,
  onConfirmOther,
  onClearOther,
}) {
  const currencySymbol = getCurrencySymbol(currency)
  const mode = selection?.mode
  const amount = selection?.amount
  const isOther = mode === "other"
  const otherReady = Boolean(parseFloat(draftOther))

  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{playerName}</p>
        {amount != null && Number(amount) > 0 && (
          <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
            {formatMoney(amount, currency)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={mode === "a" ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          onClick={() => onSelectPreset("a", optionA)}
        >
          <span className="truncate tabular-nums">{formatMoney(optionA, currency)}</span>
        </Button>
        <Button
          type="button"
          variant={mode === "b" ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          onClick={() => onSelectPreset("b", optionB)}
        >
          <span className="truncate tabular-nums">{formatMoney(optionB, currency)}</span>
        </Button>
        <Button
          type="button"
          variant={isOther ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          onClick={onSelectOther}
        >
          Other
        </Button>
      </div>

      {isOther && (
        <div className="flex gap-2 pt-1">
          <div className="relative min-w-0 flex-1">
            <MoneyInput
              currencySymbol={currencySymbol}
              placeholder="0.00"
              value={draftOther}
              onChange={(e) => onDraftOtherChange(e.target.value)}
              inputClassName="pr-10"
              aria-label={`Custom buy-in for ${playerName}`}
            />
            {draftOther && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground"
                onClick={onClearOther}
                aria-label={`Clear custom buy-in for ${playerName}`}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          <Button
            type="button"
            className={cn("h-11 shrink-0 px-4")}
            onClick={onConfirmOther}
            disabled={!otherReady}
          >
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
      )}
    </div>
  )
}
