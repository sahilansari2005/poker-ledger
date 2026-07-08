import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/currency"

export default function SessionSettlement({ settlements = [], currency = "GBP" }) {
  if (!settlements.length) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Settlement</h2>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Everyone broke even — no payments needed.
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Settlement</h2>
      <p className="text-sm text-muted-foreground">
        Who pays whom to settle up after this session.
      </p>
      <div className="space-y-2">
        {settlements.map((item) => (
          <Card key={item.id ?? `${item.from_player}-${item.to_player}-${item.amount}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
              <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-base font-semibold">
                <span className="truncate">{item.from_player}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.to_player}</span>
              </CardTitle>
              <span className="shrink-0 font-bold tabular-nums text-primary">
                {formatMoney(item.amount, currency)}
              </span>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
