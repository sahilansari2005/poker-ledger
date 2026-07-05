import { CURRENCIES } from "@/lib/currency"
import { cn } from "@/lib/utils"

export default function CurrencySelect({ value, onChange, id, className }) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.name} ({c.code})
        </option>
      ))}
    </select>
  )
}
