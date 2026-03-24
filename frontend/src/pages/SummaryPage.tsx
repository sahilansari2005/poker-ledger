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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to={`/table/${session.tableId}`}>
          <Button variant="outline" size="sm" className="sm:px-4 sm:py-2">Back</Button>
        </Link>
        <h1 className="text-lg sm:text-2xl font-bold flex-1 truncate">Summary ({session.date})</h1>
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
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-lg sm:text-xl font-bold">£{p.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit / Loss</p>
                  <p className={`text-lg sm:text-xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss > 0 ? '+' : ''}£{profitLoss.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {players.length === 0 && (
          <div className="text-muted-foreground p-4 border rounded">No players to show.</div>
        )}
      </div>
    </div>
  )
}
