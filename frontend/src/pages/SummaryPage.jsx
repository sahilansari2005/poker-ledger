import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Trophy, TrendingDown, Clock, Users, Flame, Coins, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sessionsApi } from "@/lib/api"

export default function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionsApi.get(id).then(setSession).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return null

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground animate-in fade-in zoom-in duration-500">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Summary not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
      </Card>
    </div>
  )

  const players = session.players || []
  const totalPot = players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)

  const sortedPlayers = [...players].sort((a, b) => {
    const profitA = (parseFloat(a.cash_out) || 0) - parseFloat(a.total_buy_in)
    const profitB = (parseFloat(b.cash_out) || 0) - parseFloat(b.total_buy_in)
    return profitB - profitA
  })

  const biggestWinner = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[0].cash_out) || 0) - parseFloat(sortedPlayers[0].total_buy_in)) > 0 ? sortedPlayers[0] : null
  const biggestLoser = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[sortedPlayers.length - 1].cash_out) || 0) - parseFloat(sortedPlayers[sortedPlayers.length - 1].total_buy_in)) < 0 ? sortedPlayers[sortedPlayers.length - 1] : null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center pt-8 sm:pt-16 px-4 pb-20">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-ring/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full shadow-sm hover:bg-secondary/80 bg-background/50 backdrop-blur-md" onClick={() => navigate(`/table/${session.table}`)}>
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Session Summary</h1>
              <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> {session.date}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full sm:w-auto rounded-full bg-background/50 backdrop-blur-md shadow-sm border-border/50" onClick={() => navigate(`/table/${session.table}`)}>
            <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Back to Table
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100 fill-mode-both">
          <Card className="bg-primary/5 border-primary/20 shadow-sm backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Coins className="w-16 h-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Total Pot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-foreground">£{totalPot.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {players.length} Players participated
              </p>
            </CardContent>
          </Card>

          <Card className={`${biggestWinner ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card/40 border-border/30'} shadow-sm backdrop-blur-sm relative overflow-hidden`}>
            {biggestWinner && (
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-16 h-16 text-amber-500" />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Biggest Winner</CardTitle>
            </CardHeader>
            <CardContent>
              {biggestWinner ? (
                <>
                  <div className="text-2xl font-bold tracking-tight text-amber-500 truncate">{biggestWinner.name}</div>
                  <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 py-0.5 text-xs font-bold">
                    +£{((parseFloat(biggestWinner.cash_out) || 0) - parseFloat(biggestWinner.total_buy_in)).toFixed(2)}
                  </Badge>
                </>
              ) : (
                <div className="text-xl font-bold text-muted-foreground italic">No Winner</div>
              )}
            </CardContent>
          </Card>

          <Card className={`${biggestLoser ? 'bg-destructive/5 border-destructive/20' : 'bg-card/40 border-border/30'} shadow-sm backdrop-blur-sm relative overflow-hidden`}>
            {biggestLoser && (
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flame className="w-16 h-16 text-destructive" />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Biggest Loser</CardTitle>
            </CardHeader>
            <CardContent>
              {biggestLoser ? (
                <>
                  <div className="text-2xl font-bold tracking-tight text-destructive truncate">{biggestLoser.name}</div>
                  <Badge variant="outline" className="mt-2 bg-destructive/10 text-destructive border-destructive/20 px-2 py-0.5 text-xs font-bold">
                    £{((parseFloat(biggestLoser.cash_out) || 0) - parseFloat(biggestLoser.total_buy_in)).toFixed(2)}
                  </Badge>
                </>
              ) : (
                <div className="text-xl font-bold text-muted-foreground italic">No Loser</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Final Standings</h2>
            <Badge variant="secondary" className="rounded-full bg-secondary/80">{players.length} Players</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sortedPlayers.map((p, i) => {
              const cashOut = parseFloat(p.cash_out) || 0
              const totalBuyIn = parseFloat(p.total_buy_in)
              const profitLoss = cashOut - totalBuyIn
              const isPositive = profitLoss > 0
              const isNegative = profitLoss < 0

              return (
                <Card
                  key={p.id}
                  className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{ animationDelay: `${(i * 50) + 300}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between p-5 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border
                        ${i === 0 && isPositive ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                          isPositive ? 'bg-primary/20 text-primary border-primary/30' :
                          isNegative ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-secondary text-secondary-foreground border-border/50'}`}>
                        {i + 1}
                      </div>
                      {p.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 font-bold text-sm border shadow-sm
                        ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          isNegative ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-secondary/50 text-muted-foreground border-border/30'}`}
                    >
                      {isPositive ? '+' : ''}£{profitLoss.toFixed(2)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex justify-between items-center text-sm px-2 py-3 bg-background/50 rounded-xl border border-border/30">
                      <div className="text-center w-full">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Buy-in</p>
                        <p className="font-bold">£{totalBuyIn.toFixed(2)}</p>
                      </div>
                      <div className="w-px h-8 bg-border/50 mx-2" />
                      <div className="text-center w-full">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Cashed</p>
                        <p className="font-bold">£{cashOut.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {players.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-card/20">
                <Users className="w-10 h-10 opacity-20 mx-auto mb-3" />
                <p>No players in this session.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
