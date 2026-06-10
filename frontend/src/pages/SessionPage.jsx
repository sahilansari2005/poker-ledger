import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronLeft, Plus, ShieldCheck, AlertCircle, Coins, Wallet, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { sessionsApi } from "@/lib/api"

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addValues, setAddValues] = useState({})
  const [isCashingOut, setIsCashingOut] = useState(false)
  const [cashOutValues, setCashOutValues] = useState({})

  // Add player dialog
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [addPlayerError, setAddPlayerError] = useState("")

  useEffect(() => {
    sessionsApi.get(id).then(setSession).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return null

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Session not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
      </Card>
    </div>
  )

  const handleAddSubmit = async (playerId) => {
    const amt = parseFloat(addValues[playerId])
    if (isNaN(amt) || amt <= 0) return
    try {
      const updatedPlayer = await sessionsApi.addBuyIn(id, playerId, amt)
      setSession(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerId ? updatedPlayer : p)
      }))
      setAddValues({ ...addValues, [playerId]: "" })
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    setAddPlayerError("")
    try {
      const newPlayer = await sessionsApi.addPlayer(id, newPlayerName.trim())
      setSession(prev => ({ ...prev, players: [...prev.players, newPlayer] }))
      setIsAddPlayerOpen(false)
      setNewPlayerName("")
    } catch (err) {
      setAddPlayerError(err.message)
    }
  }

  const handleStartCashOut = () => {
    setIsCashingOut(true)
    const initialValues = {}
    session.players.forEach(p => {
      initialValues[p.id] = p.cash_out !== null ? String(p.cash_out) : ""
    })
    setCashOutValues(initialValues)
  }

  const handleEndSession = async () => {
    const cashOuts = session.players.map(p => ({
      player_id: p.id,
      cash_out: parseFloat(cashOutValues[p.id]) || 0,
    }))
    try {
      await sessionsApi.complete(id, cashOuts)
      navigate(`/summary/${id}`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteSession = async () => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return
    try {
      await sessionsApi.destroy(id)
      navigate(`/table/${session.table}`, { replace: true })
    } catch (err) {
      console.error(err)
    }
  }

  const totalBuyIn = session.players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)
  const totalCashOut = session.players.reduce((sum, p) => sum + (parseFloat(cashOutValues[p.id]) || 0), 0)
  const isBalanced = Math.abs(totalBuyIn - totalCashOut) < 0.01
  const remainingToDistribute = totalBuyIn - totalCashOut

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center pt-8 sm:pt-16 px-4 pb-24">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-destructive/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full shadow-sm hover:bg-secondary/80 bg-background/50 backdrop-blur-md" onClick={() => navigate(`/table/${session.table}`)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
                {isCashingOut ? "Cash Out" : "Active Session"}
                {session.is_completed && <Badge variant="secondary" className="ml-2 mt-1">Completed</Badge>}
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">
                {session.date} • {session.players.length} Players
              </p>
            </div>
          </div>

          {!session.is_completed ? (
            <div className="w-full flex-col sm:flex-row sm:w-auto flex items-center gap-3">
              <Button variant="ghost" className="w-full sm:w-auto text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={handleDeleteSession}>
                <Trash2 className="w-5 h-5 sm:mr-0 mr-2" />
                <span className="sm:hidden font-semibold">Delete Session</span>
              </Button>
              {!isCashingOut ? (
                <Button size="lg" className="w-full shadow-lg shadow-destructive/20 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all hover:scale-105 active:scale-95 group rounded-full" onClick={handleStartCashOut}>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Proceed to Cash Out
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="w-full rounded-full bg-background/50 backdrop-blur-md" onClick={() => setIsCashingOut(false)}>
                  Back to Game
                </Button>
              )}
            </div>
          ) : (
            <Button variant="outline" className="w-full sm:w-auto text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-full border-border/50" onClick={handleDeleteSession}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Session
            </Button>
          )}
        </div>

        {!isCashingOut ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {session.players.map((p, i) => (
                <Card key={p.id} className="group relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-xl hover:-translate-y-1 animate-in fade-in zoom-in-95 fill-mode-both" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/10">
                    <div className="text-lg font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm ring-1 ring-border/50">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      {p.name}
                    </div>
                    <Badge variant="outline" className="text-sm font-bold px-2.5 py-0.5 bg-background shadow-sm border-primary/20 text-primary">
                      £{parseFloat(p.total_buy_in).toFixed(2)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 pb-2">
                    <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Add Buy-in</div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">£</span>
                        <Input type="number" placeholder="0.00" value={addValues[p.id] || ""}
                          onChange={(e) => setAddValues({ ...addValues, [p.id]: e.target.value })}
                          disabled={session.is_completed}
                          onKeyDown={e => e.key === "Enter" && handleAddSubmit(p.id)}
                          className="pl-7 h-10 bg-background/50 focus-visible:ring-primary/50 font-bold" />
                      </div>
                      <Button type="button" onClick={() => handleAddSubmit(p.id)}
                        disabled={session.is_completed || !parseFloat(addValues[p.id])}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-4 z-20 cursor-pointer">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Player Card */}
              {!session.is_completed && (
                <button onClick={() => setIsAddPlayerOpen(true)}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/40 bg-card/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 p-8 text-muted-foreground hover:text-primary min-h-[160px]">
                  <UserPlus className="w-8 h-8 opacity-40 group-hover:opacity-80 transition-opacity" />
                  <span className="text-sm font-semibold">Add Player</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Balance summary */}
            <Card className={`border-2 transition-all duration-500 shadow-xl ${isBalanced ? 'border-primary/50 shadow-primary/10 bg-primary/5' : 'border-destructive/30 shadow-destructive/10'}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center sm:text-left">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-center sm:justify-start gap-2">
                      <Coins className="w-4 h-4" /> Total In Play
                    </p>
                    <p className="text-4xl font-bold tracking-tight">£{totalBuyIn.toFixed(2)}</p>
                  </div>
                  <div className="hidden sm:flex justify-center">
                    <div className="w-px h-16 bg-border/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-center sm:justify-start gap-2">
                      <Wallet className="w-4 h-4" /> Cashed Out
                    </p>
                    <p className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${isBalanced ? 'text-primary' : 'text-foreground'}`}>
                      £{totalCashOut.toFixed(2)}
                    </p>
                  </div>
                </div>
                {!isBalanced && (
                  <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-sm">
                    <div className="flex items-center text-destructive font-semibold">
                      <AlertCircle className="w-4 h-4 mr-2" /> Balances do not match.
                    </div>
                    <div className="mt-2 sm:mt-0 font-medium text-muted-foreground">
                      Remaining: <span className="text-foreground font-bold">£{remainingToDistribute.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {isBalanced && (
                  <div className="mt-6 pt-4 border-t border-primary/20 flex items-center text-primary font-semibold text-sm">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Perfectly Balanced!
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {session.players.map((p, i) => {
                const val = parseFloat(cashOutValues[p.id]) || 0
                const isEntered = cashOutValues[p.id] !== "" && cashOutValues[p.id] !== undefined
                return (
                  <Card key={p.id} className={`transition-all duration-300 ${isEntered ? "border-primary/40 bg-card/80 shadow-md shadow-primary/5" : "border-border/30 bg-card/40"}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div className="text-base font-bold flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isEntered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                      <Badge variant="outline" className="text-xs font-medium border-border/50">
                        Invested: £{parseFloat(p.total_buy_in).toFixed(2)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">£</span>
                        <Input type="number" placeholder="Final chip count" value={cashOutValues[p.id] || ""}
                          onChange={(e) => setCashOutValues({ ...cashOutValues, [p.id]: e.target.value })}
                          className={`pl-8 text-lg font-semibold h-12 transition-all duration-300 ${isEntered ? 'border-primary/50 focus-visible:ring-primary/50' : 'bg-background/50'}`} />
                      </div>
                      {isEntered && (
                        <div className={`mt-3 text-xs font-semibold text-right ${(val - parseFloat(p.total_buy_in)) > 0 ? 'text-primary' : (val - parseFloat(p.total_buy_in)) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Net: {(val - parseFloat(p.total_buy_in)) > 0 ? '+' : ''}£{(val - parseFloat(p.total_buy_in)).toFixed(2)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {!session.is_completed && (
              <div className="flex justify-center sm:justify-end pt-8 pb-12 w-full">
                <Button size="lg"
                  className={`w-full sm:w-80 h-14 rounded-full text-lg shadow-xl transition-all duration-500 ${isBalanced ? 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={handleEndSession} disabled={!isBalanced}>
                  <ShieldCheck className="w-5 h-5 mr-2" /> Complete Session
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Player Dialog */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="sm:max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>Add a late-arriving player to this session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Player Name</Label>
            <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Their name" className="h-11 bg-background/50"
              onKeyDown={e => e.key === "Enter" && handleAddPlayer()} autoFocus />
            {addPlayerError && <p className="text-sm text-destructive">{addPlayerError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddPlayerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
