import { useParams, useNavigate } from "react-router-dom"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/currency"
import { profitLossClass } from "@/lib/utils"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useSession } from "@/lib/queries"
import PageHeader from "@/components/layout/PageHeader"
import SessionDateEdit from "@/components/session/SessionDateEdit"
import SessionSettlement from "@/components/session/SessionSettlement"
import SessionAuditLog from "@/components/session/SessionAuditLog"

export default function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: session, isLoading } = useSession(id)
  const [standingsRef] = useAnimatedList()

  if (isLoading && !session) return null

  if (!session) return (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      <Card className="flex flex-col items-center p-8">
        <AlertCircle className="mb-4 size-12 opacity-50" />
        <h2 className="text-section mb-2">Summary not found</h2>
        <Button variant="outline" onClick={() => navigate("/tables")}>Go back home</Button>
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
    <div className="page-stack">
      <PageHeader
        backTo={`/table/${session.table}`}
        title="Session summary"
        subtitle={
          <SessionDateEdit sessionId={session.id} tableId={session.table} date={session.date} />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/8">
          <CardHeader>
            <CardTitle className="text-caption">Total pot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-title tabular-nums">{formatMoney(totalPot, currency)}</p>
            <p className="mt-1 text-caption">{players.length} players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-caption">Biggest winner</CardTitle>
          </CardHeader>
          <CardContent>
            {biggestWinner ? (
              <>
                <p className="truncate font-medium">{biggestWinner.name}</p>
                <Badge className="mt-2" variant="outline">
                  +{formatMoney((parseFloat(biggestWinner.cash_out) || 0) - parseFloat(biggestWinner.total_buy_in), currency)}
                </Badge>
              </>
            ) : (
              <p className="text-caption">—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-caption">Biggest loser</CardTitle>
          </CardHeader>
          <CardContent>
            {biggestLoser ? (
              <>
                <p className="truncate font-medium">{biggestLoser.name}</p>
                <Badge className="mt-2" variant="outline">
                  {formatMoney((parseFloat(biggestLoser.cash_out) || 0) - parseFloat(biggestLoser.total_buy_in), currency)}
                </Badge>
              </>
            ) : (
              <p className="text-caption">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="section-stack">
        <h2 className="text-section">Final standings</h2>
        <div ref={standingsRef} className="space-y-4">
          {sortedPlayers.map((p, i) => {
            const cashOut = parseFloat(p.cash_out) || 0
            const totalBuyIn = parseFloat(p.total_buy_in)
            const profitLoss = cashOut - totalBuyIn

            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-3 font-medium">
                    <span className="icon-well text-sm">{i + 1}</span>
                    {p.name}
                  </CardTitle>
                  <Badge variant="outline" className={`tabular-nums ${profitLossClass(profitLoss)}`}>
                    {profitLoss > 0 ? "+" : ""}{formatMoney(profitLoss, currency)}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-caption">Buy-in</p>
                    <p className="font-medium tabular-nums">{formatMoney(totalBuyIn, currency)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-caption">Cashed</p>
                    <p className="font-medium tabular-nums">{formatMoney(cashOut, currency)}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <SessionSettlement settlements={session.settlements} currency={currency} />
      <SessionAuditLog sessionId={session.id} />

      <Button className="w-full" size="lg" variant="outline" onClick={() => navigate(`/table/${session.table}`)}>
        <CheckCircle2 className="size-4" /> Back to table
      </Button>
    </div>
  )
}
