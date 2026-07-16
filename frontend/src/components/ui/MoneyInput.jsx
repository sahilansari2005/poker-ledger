import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Amount field with a currency prefix that never overlaps the value.
 * Multi-letter codes (AED, CA$) need more room than £ / $.
 */
export default function MoneyInput({
  currencySymbol,
  className,
  inputClassName,
  ...props
}) {
  const widePrefix = String(currencySymbol || "").length > 1

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 font-medium tabular-nums text-muted-foreground",
          widePrefix ? "left-3 text-sm" : "left-3.5"
        )}
      >
        {currencySymbol}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        className={cn(
          widePrefix ? "pl-[3.25rem]" : "pl-8",
          inputClassName
        )}
        {...props}
      />
    </div>
  )
}
