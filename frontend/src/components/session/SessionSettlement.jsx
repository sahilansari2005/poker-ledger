import { ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/currency"

export default function SessionSettlement({ settlements = [], currency = "GBP" }) {
  if (!settlements.length) {
    return (
      <section className="section-stack">
        <h2 className="text-section">Settlement</h2>
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-caption">
              Everyone broke even. No payments needed.
            </CardTitle>
          </CardHeader>
        </Card>
      </section>
    )
  }

  return (
    <section className="section-stack">
      <div className="space-y-1">
        <h2 className="text-section">Settlement</h2>
        <p className="text-caption">Who pays whom to settle up after this session.</p>
      </div>
      <div className="space-y-3">
        {settlements.map((item) => (
          <Card key={item.id ?? `${item.from_player}-${item.to_player}-${item.amount}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                <span className="truncate">{item.from_player}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.to_player}</span>
              </CardTitle>
              <span className="shrink-0 font-semibold tabular-nums text-primary">
                {formatMoney(item.amount, currency)}
              </span>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
