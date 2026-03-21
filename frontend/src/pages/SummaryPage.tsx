import { useParams, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { type Session } from "./TablePage"

export default function SummaryPage() {
  const { id } = useParams()
  
  const [allSessions] = useLocalStorage<Session[]>("poker_sessions", [])
  const session = allSessions.find(s => s.id === id)

  if (!session) return <div className="p-6">Session not found</div>
  
  const players = session.players

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to={`/table/${session.tableId}`}>
          <Button variant="outline" size="sm">Back</Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex-1 truncate">Summary ({session.date})</h1>
      </div>

      <div className="grid gap-4 mt-4 sm:mt-6">
        {players.map(p => {
           const cashOut = p.cashOut ?? 0;
           const profitLoss = cashOut - p.total;

          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle>{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Invested</p>
                  <p className="text-lg sm:text-xl font-bold">£{p.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Profit / Loss</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base sm:text-lg font-bold ${profitLoss >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                    {profitLoss > 0 ? '+' : ''}£{profitLoss.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {players.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
            <p className="text-muted-foreground text-sm font-medium mb-1">No players to show.</p>
          </div>
        )}
      </div>
    </div>
  )
}
