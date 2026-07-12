import { TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/currency"

export function computePlayerStats(members, sessions, transfers) {
  const stats = members.reduce((acc, m) => {
    acc[m.name] = { totalInvested: 0, totalProfit: 0 }
    sessions.filter(s => s.is_completed).forEach(session => {
      const p = session.players.find(p => p.name === m.name)
      if (p) {
        acc[m.name].totalInvested += parseFloat(p.total_buy_in)
        if (p.cash_out !== null) {
          acc[m.name].totalProfit += parseFloat(p.cash_out) - parseFloat(p.total_buy_in)
        }
      }
    })
    return acc
  }, {})

  ;(transfers || []).forEach((transfer) => {
    const amount = parseFloat(transfer.amount)
    if (stats[transfer.from_player]) {
      stats[transfer.from_player].totalProfit -= amount
    }
    if (stats[transfer.to_player]) {
      stats[transfer.to_player].totalProfit += amount
    }
  })

  return stats
}

export default function Leaderboard({ members, sessions, transfers, currency }) {
  const playerStats = computePlayerStats(members, sessions, transfers)
  const sortedMembers = [...members].sort(
    (a, b) => (playerStats[b.name]?.totalProfit || 0) - (playerStats[a.name]?.totalProfit || 0)
  )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Leaderboard</h2>
        <Badge variant="outline" className="text-xs">All-time</Badge>
      </div>
      <Card>
        <CardContent className="divide-y divide-border/30 p-0">
          {sortedMembers.map((member) => {
            const stats = playerStats[member.name]
            const isPositive = stats.totalProfit > 0
            const isNegative = stats.totalProfit < 0
            return (
              <div key={member.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(stats.totalInvested, currency)} invested</p>
                  </div>
                </div>
                <Badge variant="secondary" className={`shrink-0 ${isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : ""}`}>
                  {isPositive && <TrendingUp className="mr-1 size-3.5" />}
                  {isNegative && <TrendingDown className="mr-1 size-3.5" />}
                  {isPositive ? "+" : ""}{formatMoney(stats.totalProfit, currency)}
                </Badge>
              </div>
            )
          })}
          {sortedMembers.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No players yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
