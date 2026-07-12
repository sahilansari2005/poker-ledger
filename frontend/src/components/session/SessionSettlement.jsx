import { ArrowRight } from "lucide-react"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import { formatMoney } from "@/lib/currency"

export default function SessionSettlement({ settlements = [], currency = "GBP" }) {
  if (!settlements.length) {
    return (
      <section className="section-stack">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-section">Settlement</h2>
          <SectionPill text="Even" />
        </div>
        <SpotlightCard className="p-5">
          <p className="text-caption">Everyone broke even. No payments needed.</p>
        </SpotlightCard>
      </section>
    )
  }

  return (
    <section className="section-stack">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-section">Settlement</h2>
          <SectionPill text="Pay up" />
        </div>
        <p className="text-caption">Who pays whom to settle up after this session.</p>
      </div>
      <div className="space-y-3">
        {settlements.map((item) => (
          <SpotlightCard
            key={item.id ?? `${item.from_player}-${item.to_player}-${item.amount}`}
            className="flex flex-row items-center justify-between gap-4 p-5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 font-medium">
              <span className="truncate">{item.from_player}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{item.to_player}</span>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-primary">
              {formatMoney(item.amount, currency)}
            </span>
          </SpotlightCard>
        ))}
      </div>
    </section>
  )
}
