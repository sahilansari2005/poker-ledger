import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Play, ChevronLeft, CalendarPlus, TrendingUp, TrendingDown, Users, CopyPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocalStorage } from "@/hooks/useLocalStorage"

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [tables] = useLocalStorage("poker_tables", [])
  const table = tables.find(t => t.id === id)
  
  const [allSessions, setAllSessions] = useLocalStorage("poker_sessions", [])
  const tableSessions = allSessions.filter(s => s.tableId === id)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])

  if (!table) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground animate-in fade-in zoom-in duration-500">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <Users className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Table not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
      </Card>
    </div>
  )

  const members = table.members || []

  const handleOpenNewSession = () => {
    setSelectedMembers([...members])
    setIsDialogOpen(true)
  }

  const toggleMember = (m) => {
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
    
    const newSession = {
      id: newId,
      tableId: table.id,
      date: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      players,
      defaultBuyIn: table.defaultBuyIn || 0,
      isCompleted: false
    }
    
    setAllSessions([newSession, ...allSessions])
    setIsDialogOpen(false)
    navigate(`/session/${newId}`)
  }

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
  }, {})

  // Sort players by profit
  const sortedMembers = [...members].sort((a, b) => playerStats[b].totalProfit - playerStats[a].totalProfit)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center pt-8 sm:pt-16 px-4 pb-20">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-5xl space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full shadow-sm hover:bg-secondary/80 bg-background/50 backdrop-blur-md" onClick={() => navigate("/")}>
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate max-w-[250px] sm:max-w-md">
                {table.name}
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> {members.length} Players • £{table.defaultBuyIn} Buy-in
              </p>
            </div>
          </div>
          <Button onClick={handleOpenNewSession} size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
            <Play className="mr-2 h-4 w-4 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
            Start Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Players Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Leaderboard</h2>
              <Badge variant="outline" className="rounded-full px-3 text-xs bg-background/50 backdrop-blur-md">All-Time</Badge>
            </div>
            
            <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
              <ScrollArea className="h-[400px] w-full">
                <div className="p-1">
                  {sortedMembers.map((member, i) => {
                    const stats = playerStats[member]
                    const isPositive = stats.totalProfit > 0
                    const isNegative = stats.totalProfit < 0
                    const isNeutral = stats.totalProfit === 0
                    
                    return (
                      <div 
                        key={member}
                        className={`group relative flex items-center justify-between p-4 mb-2 rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-border/50 animate-in fade-in slide-in-from-right-4 fill-mode-both`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                            ${i === 0 && isPositive ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 
                              i === 1 && isPositive ? 'bg-slate-400/20 text-slate-400 border border-slate-400/30' : 
                              i === 2 && isPositive ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 
                              'bg-secondary text-secondary-foreground'}`}
                          >
                            {i < 3 && isPositive ? (i + 1) : member.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-base">{member}</p>
                            <p className="text-xs text-muted-foreground">Invested: £{stats.totalInvested}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <Badge 
                            variant="secondary"
                            className={`px-3 py-1 text-sm font-bold border rounded-full backdrop-blur-md shadow-sm
                              ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                isNegative ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                'bg-secondary/50 text-muted-foreground border-border/30'}`}
                          >
                            {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                            {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                            {isNeutral && <span className="mr-1 opacity-50">-</span>}
                            {isPositive ? '+' : ''}£{stats.totalProfit}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                  
                  {sortedMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                       <Users className="w-8 h-8 opacity-20 mb-2" />
                       <p>No players added to this table yet.</p>
                       <p className="text-xs max-w-xs">Create a session to add players to the table implicitly.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Sessions Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Recent Sessions</h2>
              <Badge variant="secondary" className="rounded-full">{tableSessions.length}</Badge>
            </div>

            <div className="space-y-4">
              {tableSessions.slice(0, 5).map((session, i) => (
                <Link key={session.id} to={`/session/${session.id}`} className="block">
                  <Card className={`group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-lg hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-6 fill-mode-both`} style={{ animationDelay: `${i * 100 + 200}ms` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-5 pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarPlus className="w-4 h-4 text-muted-foreground" />
                          {session.date || "Unknown Date"}
                        </CardTitle>
                        <CardDescription>{session.players?.length || 0} participants</CardDescription>
                      </div>
                      <Badge variant={session.isCompleted === false ? "default" : "secondary"} className={`rounded-full shadow-sm ${session.isCompleted === false ? 'bg-primary animate-pulse text-primary-foreground' : 'bg-secondary/50'}`}>
                        {session.isCompleted === false ? 'Active' : 'Finished'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 bg-background/30 flex justify-between items-center">
                       <div className="flex -space-x-2">
                         {session.players.slice(0, 4).map((p, idx) => (
                           <div key={idx} className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-bold text-secondary-foreground ring-1 ring-border/50 shadow-sm z-10 transition-transform group-hover:scale-110" style={{ transitionDelay: `${idx * 50}ms` }}>
                             {p.name.charAt(0).toUpperCase()}
                           </div>
                         ))}
                         {session.players.length > 4 && (
                           <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground z-10 shadow-sm">
                             +{session.players.length - 4}
                           </div>
                         )}
                       </div>
                       <span className="text-xs font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:flex items-center">
                         View Details <ChevronLeft className="w-3 h-3 ml-1 rotate-180" />
                       </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {tableSessions.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-card/10 text-center animate-in fade-in zoom-in-95 duration-500 delay-300 fill-mode-both">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <CalendarPlus className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold px-4">No Sessions Recorded</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Start a new session to track game stats.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Who's at the table?</DialogTitle>
            <DialogDescription>
              Select the players participating in this session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isSelected = selectedMembers.includes(m)
                return (
                  <Badge 
                    key={m}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 text-sm rounded-full transition-all active:scale-95 ${isSelected ? 'shadow-md shadow-primary/20 bg-primary hover:bg-primary/90' : 'hover:bg-secondary border-border/50 bg-background/50 backdrop-blur-md'}`}
                    onClick={() => toggleMember(m)}
                  >
                    {m}
                  </Badge>
                )
              })}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground italic p-2">No members in table. Edit table first.</p>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/20">
            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">
                {selectedMembers.length} selected
              </span>
              <div className="space-x-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartSession} disabled={selectedMembers.length === 0} className="rounded-xl shadow-md">
                  <Play className="w-4 h-4 mr-2" /> Start Game
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
