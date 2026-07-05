import { useParams, useNavigate } from "react-router-dom"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useSession } from "@/lib/queries"
import PageHeader from "@/components/layout/PageHeader"

export default function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: session, isLoading } = useSession(id)
  const [standingsRef] = useAnimatedList()

  if (isLoading && !session) return null

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground animate-in fade-in zoom-in duration-500">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Summary not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
      </Card>
    </div>
  )

  const players = session.players || []
  const currency = session.table_currency || "GBP"
  const totalPot = players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)

  const sortedPlayers = [...players].sort((a, b) => {
    const profitA = (parseFloat(a.cash_out) || 0) - parseFloat(a.total_buy_in)
    const profitB = (parseFloat(b.cash_out) || 0) - parseFloat(b.total_buy_in)
    return profitB - profitA
  })

  const biggestWinner = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[0].cash_out) || 0) - parseFloat(sortedPlayers[0].total_buy_in)) > 0 ? sortedPlayers[0] : null
  const biggestLoser = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[sortedPlayers.length - 1].cash_out) || 0) - parseFloat(sortedPlayers[sortedPlayers.length - 1].total_buy_in)) < 0 ? sortedPlayers[sortedPlayers.length - 1] : null

  return (
    <div className="space-y-6">
      <PageHeader
        backTo={`/table/${session.table}`}
        title="Session Summary"
        subtitle={session.date}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Pot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatMoney(totalPot, currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{players.length} players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Biggest Winner</CardTitle>
          </CardHeader>
          <CardContent>
            {biggestWinner ? (
              <>
                <p className="text-xl font-bold truncate">{biggestWinner.name}</p>
                <Badge className="mt-2" variant="outline">
                  +{formatMoney((parseFloat(biggestWinner.cash_out) || 0) - parseFloat(biggestWinner.total_buy_in), currency)}
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Biggest Loser</CardTitle>
          </CardHeader>
          <CardContent>
            {biggestLoser ? (
              <>
                <p className="text-xl font-bold truncate">{biggestLoser.name}</p>
                <Badge className="mt-2" variant="outline">
                  {formatMoney((parseFloat(biggestLoser.cash_out) || 0) - parseFloat(biggestLoser.total_buy_in), currency)}
                </Badge>
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Final Standings</h2>
        <div ref={standingsRef} className="space-y-3">
          {sortedPlayers.map((p, i) => {
            const cashOut = parseFloat(p.cash_out) || 0
            const totalBuyIn = parseFloat(p.total_buy_in)
            const profitLoss = cashOut - totalBuyIn
            const isPositive = profitLoss > 0
            const isNegative = profitLoss < 0

            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs">{i + 1}</span>
                    {p.name}
                  </CardTitle>
                  <Badge variant="outline" className={isPositive ? "text-emerald-600" : isNegative ? "text-destructive" : ""}>
                    {isPositive ? "+" : ""}{formatMoney(profitLoss, currency)}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 px-4 pb-4 text-center text-sm">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Buy-in</p>
                    <p className="font-bold">{formatMoney(totalBuyIn, currency)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Cashed</p>
                    <p className="font-bold">{formatMoney(cashOut, currency)}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Button className="h-12 w-full rounded-xl" variant="outline" onClick={() => navigate(`/table/${session.table}`)}>
        <CheckCircle2 className="mr-2 size-4" /> Back to Table
      </Button>
    </div>
  )
}
