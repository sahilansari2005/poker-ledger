import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function profitLossClass(amount) {
  if (amount > 0) return "text-profit"
  if (amount < 0) return "text-loss"
  return "text-muted-foreground"
}
