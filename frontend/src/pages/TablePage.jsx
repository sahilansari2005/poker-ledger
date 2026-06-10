import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Play, ChevronLeft, CalendarPlus, TrendingUp, TrendingDown, Users, Settings, UserPlus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tablesApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [table, setTable] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Start session dialog
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])

  // Settings dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBuyIn, setEditBuyIn] = useState("")
  const [editMembersStr, setEditMembersStr] = useState("")
  const [inviteUsername, setInviteUsername] = useState("")
  const [settingsError, setSettingsError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      tablesApi.list().then(tables => tables.find(t => t.id === parseInt(id))),
      tablesApi.listSessions(id),
    ]).then(([t, s]) => {
      setTable(t)
      setSessions(s)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return null

  if (!table) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <Users className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Table not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
      </Card>
    </div>
  )

  const isOwner = table.owner_id === user?.id || table.is_owner
  const members = table.members || []

  // Start session
  const handleOpenNewSession = () => {
    setSelectedMembers(members.map(m => m.name))
    setIsStartDialogOpen(true)
  }

  const toggleMember = (name) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleStartSession = async () => {
    if (selectedMembers.length === 0) return
    try {
      const newSession = await tablesApi.createSession(id, selectedMembers)
      setIsStartDialogOpen(false)
      navigate(`/session/${newSession.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  // Settings
  const openSettings = () => {
    setEditName(table.name)
    setEditBuyIn(String(table.default_buy_in))
    setEditMembersStr(members.map(m => m.name).join(", "))
    setInviteUsername("")
    setSettingsError("")
    setIsSettingsOpen(true)
  }

  const handleSaveTable = async () => {
    setSettingsError("")
    setSaving(true)
    try {
      const memberNames = editMembersStr.split(",").map(s => s.trim()).filter(Boolean)
      const updated = await tablesApi.update(id, editName, parseFloat(editBuyIn) || 0, memberNames)
      setTable(updated)
      setIsSettingsOpen(false)
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return
    setSettingsError("")
    setSaving(true)
    try {
      const updated = await tablesApi.invite(id, inviteUsername.trim())
      setTable(updated)
      setInviteUsername("")
    } catch (err) {
      setSettingsError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCollaborator = async (userId) => {
    try {
      const updated = await tablesApi.removeCollaborator(id, userId)
      setTable(updated)
    } catch (err) {
      setSettingsError(err.message)
    }
  }

  const handleDeleteTable = async () => {
    if (!window.confirm("Delete this table and all its sessions? This cannot be undone.")) return
    try {
      await tablesApi.destroy(id)
      navigate("/")
    } catch (err) {
      setSettingsError(err.message)
    }
  }

  // Stats
  const playerStats = members.reduce((acc, m) => {
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

  const sortedMembers = [...members].sort(
    (a, b) => (playerStats[b.name]?.totalProfit || 0) - (playerStats[a.name]?.totalProfit || 0)
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center pt-8 sm:pt-16 px-4 pb-20">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full shadow-sm hover:bg-secondary/80 bg-background/50 backdrop-blur-md" onClick={() => navigate("/")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate max-w-[250px] sm:max-w-md">
                {table.name}
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> {members.length} Players • £{table.default_buy_in} Buy-in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur-md" onClick={openSettings} title="Table settings">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={handleOpenNewSession} size="lg" className="flex-1 sm:flex-none rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
              <Play className="mr-2 h-4 w-4 fill-current" />
              Start Session
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Leaderboard</h2>
              <Badge variant="outline" className="rounded-full px-3 text-xs bg-background/50 backdrop-blur-md">All-Time</Badge>
            </div>
            <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
              <ScrollArea className="h-[400px] w-full">
                <div className="p-1">
                  {sortedMembers.map((member, i) => {
                    const stats = playerStats[member.name]
                    const isPositive = stats.totalProfit > 0
                    const isNegative = stats.totalProfit < 0
                    const isNeutral = stats.totalProfit === 0
                    return (
                      <div key={member.id} className="group relative flex items-center justify-between p-4 mb-2 rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                            ${i === 0 && isPositive ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                              i === 1 && isPositive ? 'bg-slate-400/20 text-slate-400 border border-slate-400/30' :
                              i === 2 && isPositive ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                              'bg-secondary text-secondary-foreground'}`}>
                            {i < 3 && isPositive ? (i + 1) : member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-base">{member.name}</p>
                            <p className="text-xs text-muted-foreground">Invested: £{stats.totalInvested.toFixed(2)}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`px-3 py-1 text-sm font-bold border rounded-full
                          ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            isNegative ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-secondary/50 text-muted-foreground border-border/30'}`}>
                          {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                          {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                          {isNeutral && <span className="mr-1 opacity-50">-</span>}
                          {isPositive ? '+' : ''}£{stats.totalProfit.toFixed(2)}
                        </Badge>
                      </div>
                    )
                  })}
                  {sortedMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                      <Users className="w-8 h-8 opacity-20 mb-2" />
                      <p>No players yet. Edit the table to add members.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Sessions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Recent Sessions</h2>
              <Badge variant="secondary" className="rounded-full">{sessions.length}</Badge>
            </div>
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session, i) => (
                <Link key={session.id} to={session.is_completed ? `/summary/${session.id}` : `/session/${session.id}`} className="block">
                  <Card className="group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: `${i * 100 + 200}ms` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="p-5 pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CalendarPlus className="w-4 h-4 text-muted-foreground" />
                          {session.date}
                        </CardTitle>
                        <CardDescription>{session.players?.length || 0} participants</CardDescription>
                      </div>
                      <Badge variant={!session.is_completed ? "default" : "secondary"} className={`rounded-full shadow-sm ${!session.is_completed ? 'bg-primary animate-pulse text-primary-foreground' : 'bg-secondary/50'}`}>
                        {!session.is_completed ? 'Active' : 'Finished'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 bg-background/30 flex -space-x-2">
                      {session.players.slice(0, 4).map((p, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-bold text-secondary-foreground ring-1 ring-border/50 shadow-sm z-10">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {session.players.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground z-10 shadow-sm">
                          +{session.players.length - 4}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {sessions.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-card/10 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <CalendarPlus className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold px-4">No Sessions Yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Start a new session to track game stats.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Session Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Who's at the table?</DialogTitle>
            <DialogDescription>Select the players participating in this session.</DialogDescription>
          </DialogHeader>
          <div className="py-2 flex flex-wrap gap-2">
            {members.map(m => {
              const isSelected = selectedMembers.includes(m.name)
              return (
                <Badge key={m.id} variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm rounded-full transition-all active:scale-95 ${isSelected ? 'bg-primary hover:bg-primary/90 shadow-md' : 'hover:bg-secondary border-border/50'}`}
                  onClick={() => toggleMember(m.name)}>
                  {m.name}
                </Badge>
              )
            })}
            {members.length === 0 && <p className="text-sm text-muted-foreground italic">No members. Edit the table first.</p>}
          </div>
          <DialogFooter className="pt-4 border-t border-border/20">
            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedMembers.length} selected</span>
              <div className="space-x-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setIsStartDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartSession} disabled={selectedMembers.length === 0} className="rounded-xl">
                  <Play className="w-4 h-4 mr-2" /> Start Game
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Table Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="sharing" className="flex-1">Sharing</TabsTrigger>
              {isOwner && <TabsTrigger value="danger" className="flex-1 text-destructive">Danger</TabsTrigger>}
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11 bg-background/50" disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label>Default Buy-in</Label>
                <Input type="number" value={editBuyIn} onChange={e => setEditBuyIn(e.target.value)} className="h-11 bg-background/50" disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label>Members (comma separated)</Label>
                <Input value={editMembersStr} onChange={e => setEditMembersStr(e.target.value)} placeholder="Ali, Fayyad, John" className="h-11 bg-background/50" disabled={!isOwner} />
              </div>
              {settingsError && <p className="text-sm text-destructive">{settingsError}</p>}
              {isOwner && (
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveTable} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
                </DialogFooter>
              )}
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Current Collaborators</Label>
                {(table.collaborators || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No collaborators yet.</p>
                ) : (
                  <div className="space-y-2">
                    {table.collaborators.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
                        <span className="text-sm font-medium">{c.username}</span>
                        {isOwner && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCollaborator(c.id)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="space-y-2">
                  <Label>Invite by Username</Label>
                  <div className="flex gap-2">
                    <Input value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} placeholder="their_username" className="h-11 bg-background/50"
                      onKeyDown={e => e.key === "Enter" && handleInvite()} />
                    <Button onClick={handleInvite} disabled={saving || !inviteUsername.trim()} className="shrink-0">
                      <UserPlus className="w-4 h-4 mr-2" /> Invite
                    </Button>
                  </div>
                </div>
              )}
              {settingsError && <p className="text-sm text-destructive">{settingsError}</p>}
            </TabsContent>

            {isOwner && (
              <TabsContent value="danger" className="pt-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-destructive">Delete Table</p>
                  <p className="text-xs text-muted-foreground">This permanently deletes the table and all its sessions. There is no undo.</p>
                  <Button variant="destructive" className="w-full" onClick={handleDeleteTable}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
