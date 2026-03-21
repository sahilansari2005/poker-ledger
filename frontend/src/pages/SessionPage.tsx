import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { type Session, type SessionPlayer } from "./TablePage"

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [allSessions, setAllSessions] = useLocalStorage<Session[]>("poker_sessions", [])
  const session = allSessions.find(s => s.id === id)

  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [txPlayer, setTxPlayer] = useState<SessionPlayer | null>(null)
  const [txAmount, setTxAmount] = useState("")

  const [isCashingOut, setIsCashingOut] = useState(false)
  const [cashOutValues, setCashOutValues] = useState<Record<string, string>>({})

  const updatePlayerTotal = (playerId: string, amountToAdd: number) => {
    setAllSessions(allSessions.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        players: s.players.map(p => 
          p.id === playerId ? { ...p, total: p.total + amountToAdd } : p
        )
      }
    }))
  }

  const handleQuickAdd = (p: SessionPlayer) => {
    updatePlayerTotal(p.id, session?.defaultBuyIn || 10)
  }

  const handleOpenTx = (p: SessionPlayer) => {
    setTxPlayer(p)
    setTxAmount("")
    setTxDialogOpen(true)
  }

  const handleTxSubmit = () => {
    if (!txPlayer || !txAmount) return
    const amt = parseFloat(txAmount)
    if (isNaN(amt)) return

    updatePlayerTotal(txPlayer.id, amt)
    setTxDialogOpen(false)
  }

  const handleStartCashOut = () => {
    setIsCashingOut(true)
    const initialValues: Record<string, string> = {}
    session?.players.forEach(p => {
      initialValues[p.id] = (p.cashOut !== undefined) ? p.cashOut.toString() : ""
    })
    setCashOutValues(initialValues)
  }

  const handleEndSession = () => {
    if (!session) return

    const totalBuyIn = session.players.reduce((sum, p) => sum + p.total, 0)
    const totalCashOut = session.players.reduce((sum, p) => sum + (parseFloat(cashOutValues[p.id]) || 0), 0)

    if (totalBuyIn !== totalCashOut) {
      alert(`Error: Total Buy-in (£${totalBuyIn}) does not match Total Cash-out (£${totalCashOut}). Difference of £${Math.abs(totalBuyIn - totalCashOut)}`)
      return
    }

    setAllSessions(allSessions.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        isCompleted: true,
        players: s.players.map(p => ({
          ...p,
          cashOut: parseFloat(cashOutValues[p.id]) || 0
        }))
      }
    }))
    
    navigate(`/summary/${id}`)
  }

  if (!session) return <div className="p-6">Session not found</div>

  const totalBuyIn = session.players.reduce((sum, p) => sum + p.total, 0)
  const totalCashOut = session.players.reduce((sum, p) => sum + (parseFloat(cashOutValues[p.id]) || 0), 0)
  const isBalanced = totalBuyIn === totalCashOut

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <Link to={`/table/${session.tableId}`}>
            <Button variant="outline" size="sm">Back</Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex-1 truncate">
            {isCashingOut ? "Cash Out" : "Session"}
          </h1>
        </div>
        
        {!isCashingOut ? (
          <Button className="w-full sm:w-auto shadow-sm" variant="destructive" onClick={handleStartCashOut}>End Session</Button>
        ) : (
          <Button className="w-full sm:w-auto shadow-sm" variant="default" onClick={() => setIsCashingOut(false)}>Resume Session</Button>
        )}
      </div>

      {!isCashingOut ? (
        <div className="grid gap-4 md:grid-cols-2">
          {session.players.map(p => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle>{p.name}</CardTitle>
                <div className="text-lg sm:text-xl font-bold">£{p.total}</div>
              </CardHeader>
              <CardContent className="flex gap-2 mt-4">
                <Button onClick={() => handleQuickAdd(p)} className="flex-1">
                  +£{session.defaultBuyIn || 10}
                </Button>
                <Button onClick={() => handleOpenTx(p)} variant="outline" className="flex-1">
                  Custom
                </Button>
              </CardContent>
            </Card>
          ))}
          {session.players.length === 0 && (
            <div className="md:col-span-2 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
              <p className="text-muted-foreground text-sm font-medium">No players connected to this session.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-5 sm:p-6 rounded-2xl flex justify-between items-center border border-border/50 backdrop-blur-sm shadow-sm">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">In Play</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">£{totalBuyIn}</p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Cashed Out</p>
              <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${isBalanced ? 'text-green-600' : 'text-red-500'}`}>£{totalCashOut}</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {session.players.map(p => (
              <Card key={p.id} className={parseFloat(cashOutValues[p.id]) >= 0 ? "border-primary/50" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground text-sm font-normal">Invested: £{p.total}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="text-xs font-medium leading-none block text-muted-foreground mb-2">Final Chip Count (£)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 15.50"
                    value={cashOutValues[p.id]}
                    onChange={(e) => setCashOutValues({ ...cashOutValues, [p.id]: e.target.value })}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={handleEndSession} 
              disabled={!isBalanced}
            >
              Complete Validation & End
            </Button>
          </div>
        </div>
      )}

      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        {txPlayer && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Amount to {txPlayer.name}</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Amount (£)</label>
                <Input 
                  type="number" 
                  value={txAmount} 
                  onChange={e => setTxAmount(e.target.value)} 
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTxDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleTxSubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
