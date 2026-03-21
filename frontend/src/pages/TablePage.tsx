import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { type Table } from "./Dashboard"

export type SessionPlayer = { id: string; name: string; total: number; cashOut?: number }
export type Session = { id: string; tableId: string; date: string; players: SessionPlayer[]; defaultBuyIn: number; isCompleted?: boolean }

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [tables] = useLocalStorage<Table[]>("poker_tables", [])
  const table = tables.find(t => t.id === id)
  
  const [allSessions, setAllSessions] = useLocalStorage<Session[]>("poker_sessions", [])
  const tableSessions = allSessions.filter(s => s.tableId === id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  if (!table) return <div className="p-6">Table not found</div>

  const members = table.members || []

  const handleOpenNewSession = () => {
    setSelectedMembers([...members]) // Default all to selected
    setIsDialogOpen(true)
  }

  const toggleMember = (m: string) => {
    if (selectedMembers.includes(m)) {
      setSelectedMembers(selectedMembers.filter(sm => sm !== m))
    } else {
      setSelectedMembers([...selectedMembers, m])
    }
  }

  const handleStartSession = () => {
    if (selectedMembers.length === 0) return

    const newId = `session-${Date.now()}`
    const players = selectedMembers.map((name, i) => ({
      id: `${Date.now()}-${i}`,
      name,
      total: 0
    }))
    
    const newSession: Session = {
      id: newId,
      tableId: table.id,
      date: new Date().toLocaleDateString(),
      players,
      defaultBuyIn: table.defaultBuyIn || 10,
      isCompleted: false
    }
    
    setAllSessions([newSession, ...allSessions])
    setIsDialogOpen(false)
    navigate(`/session/${newId}`)
  }

  // Calculate total profit/loss (cashOut - total) in that table per active player across ONLY completed sessions
  const playerStats = members.reduce((acc, name) => {
    acc[name] = { totalInvested: 0, totalProfit: 0 }
    tableSessions.filter(s => s.isCompleted !== false).forEach(session => {
      const p = session.players.find(p => p.name === name)
      if (p) {
        acc[name].totalInvested += p.total
        if (p.cashOut !== undefined) {
          acc[name].totalProfit += (p.cashOut - p.total)
        }
      }
    })
    return acc
  }, {} as Record<string, { totalInvested: number, totalProfit: number }>)

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="sm:px-4 sm:py-2">Back</Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold flex-1 truncate">{table.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-4 sm:mt-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Active Players Stats</h2>
          <div className="grid gap-2">
            {members.map(member => {
              const stats = playerStats[member]
              return (
                <Card key={member}>
                  <CardContent className="flex flex-col py-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{member}</span>
                      <span className={`text-lg sm:text-xl font-bold ${stats.totalProfit > 0 ? 'text-green-600' : stats.totalProfit < 0 ? 'text-red-600' : ''}`}>
                        {stats.totalProfit > 0 ? '+' : ''}£{stats.totalProfit}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground self-end">
                      Net Profit/Loss (Total Invested: £{stats.totalInvested})
                    </span>
                  </CardContent>
                </Card>
              )
            })}
            {members.length === 0 && (
              <div className="text-muted-foreground p-4 border rounded text-sm">No members yet.</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-semibold">Sessions</h2>
            <Button className="w-full sm:w-auto" onClick={handleOpenNewSession}>New Session</Button>
          </div>
          <div className="grid gap-2">
            {tableSessions.map(s => (
              <Card key={s.id}>
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>{s.date} {!s.isCompleted && <span className="text-xs font-normal text-orange-500 ml-2">(Active)</span>}</span>
                    <Link to={`/session/${s.id}`}>
                      <Button variant="secondary" size="sm">Open</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
            {tableSessions.length === 0 && (
              <div className="text-muted-foreground p-4 border rounded">No sessions yet.</div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who is playing today?</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid grid-cols-2 gap-2">
            {members.map(m => (
              <Button 
                key={m} 
                variant={selectedMembers.includes(m) ? "default" : "outline"}
                onClick={() => toggleMember(m)}
              >
                {m}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStartSession} disabled={selectedMembers.length === 0}>
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
