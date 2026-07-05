import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Play, CalendarPlus, TrendingUp, TrendingDown, Users, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import {
  useTable,
  useTableSessions,
  useCreateSession,
  useUpdateTable,
  useDeleteTable,
} from "@/lib/queries"
import CurrencySelect from "@/components/CurrencySelect"
import PageHeader from "@/components/layout/PageHeader"
import StickyActionBar from "@/components/layout/StickyActionBar"

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: table, isLoading: tableLoading } = useTable(id)
  const { data: sessions = [], isLoading: sessionsLoading } = useTableSessions(id)
  const createSession = useCreateSession(id)
  const updateTable = useUpdateTable(id)
  const deleteTable = useDeleteTable(id)

  const [sessionsListRef] = useAnimatedList()

  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBuyIn, setEditBuyIn] = useState("")
  const [editMembersStr, setEditMembersStr] = useState("")
  const [editCurrency, setEditCurrency] = useState("GBP")
  const [settingsError, setSettingsError] = useState("")

  const loading = tableLoading && !table

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

  const members = table.members || []

  const handleOpenNewSession = () => {
    setSelectedMembers(members.map(m => m.name))
    setIsStartDialogOpen(true)
  }

  const toggleMember = (name) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleStartSession = () => {
    if (selectedMembers.length === 0) return

    createSession.mutate(selectedMembers, {
      onSuccess: (newSession) => {
        setIsStartDialogOpen(false)
        navigate(`/session/${newSession.id}`)
      },
    })
  }

  const openSettings = () => {
    setEditName(table.name)
    setEditBuyIn(String(table.default_buy_in))
    setEditMembersStr(members.map(m => m.name).join(", "))
    setEditCurrency(table.currency || "GBP")
    setSettingsError("")
    setIsSettingsOpen(true)
  }

  const handleSaveTable = () => {
    setSettingsError("")

    updateTable.mutate(
      {
        name: editName,
        buyIn: parseFloat(editBuyIn) || 0,
        memberNames: editMembersStr.split(",").map(s => s.trim()).filter(Boolean),
        currency: editCurrency,
      },
      {
        onSuccess: () => setIsSettingsOpen(false),
        onError: (err) => setSettingsError(err.message),
      }
    )
  }

  const handleDeleteTable = () => {
    if (!window.confirm("Delete this table and all its sessions? This cannot be undone.")) return

    deleteTable.mutate(undefined, {
      onSuccess: () => navigate("/"),
      onError: (err) => setSettingsError(err.message),
    })
  }

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
    <div className="space-y-6 pb-28">
      <PageHeader
        backTo="/"
        title={table.name}
        subtitle={`${members.length} players · ${formatMoney(table.default_buy_in, table.currency)} buy-in`}
        action={
          <Button variant="outline" size="icon" onClick={openSettings} aria-label="Table settings">
            <Settings className="size-4" />
          </Button>
        }
      />

      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Leaderboard</h2>
            <Badge variant="outline" className="text-xs">All-time</Badge>
          </div>
          <Card>
            <CardContent className="divide-y divide-border/30 p-0">
              {sortedMembers.map((member) => {
                const stats = playerStats[member.name]
                const isPositive = stats.totalProfit > 0
                const isNegative = stats.totalProfit < 0
                return (
                  <div key={member.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(stats.totalInvested, table.currency)} invested</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 ${isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : ""}`}>
                      {isPositive && <TrendingUp className="mr-1 size-3.5" />}
                      {isNegative && <TrendingDown className="mr-1 size-3.5" />}
                      {isPositive ? "+" : ""}{formatMoney(stats.totalProfit, table.currency)}
                    </Badge>
                  </div>
                )
              })}
              {sortedMembers.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">No players yet. Edit the table to add members.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Sessions</h2>
            <Badge variant="secondary">{sessions.length}</Badge>
          </div>
          <div ref={sessionsListRef} className="space-y-3">
            {sessions.map((session) => (
              <Link key={session.id} to={session.is_completed ? `/summary/${session.id}` : `/session/${session.id}`} className="block">
                <Card className="active:scale-[0.99] transition-transform touch-manipulation">
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarPlus className="size-4 text-muted-foreground" />
                        {session.date}
                      </CardTitle>
                      <CardDescription>{session.players?.length || 0} players</CardDescription>
                    </div>
                    <Badge variant={!session.is_completed ? "default" : "secondary"}>
                      {!session.is_completed ? "Active" : "Done"}
                    </Badge>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {!sessionsLoading && sessions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/40 py-10 text-center text-sm text-muted-foreground">
                No sessions yet. Start one below.
              </div>
            )}
          </div>
        </section>
      </div>

      <StickyActionBar>
        <Button size="lg" className="h-12 w-full rounded-xl" onClick={handleOpenNewSession}>
          <Play className="mr-2 size-4 fill-current" />
          Start Session
        </Button>
      </StickyActionBar>

      <ResponsiveDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
          <ResponsiveDialogHeader className="pb-4">
            <ResponsiveDialogTitle className="text-2xl">Who's at the table?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Select the players participating in this session.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
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
          <ResponsiveDialogFooter className="pt-4 border-t border-border/20">
            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedMembers.length} selected</span>
              <div className="space-x-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setIsStartDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartSession} disabled={selectedMembers.length === 0 || createSession.isPending} className="rounded-xl">
                  <Play className="w-4 h-4 mr-2" /> {createSession.isPending ? "Starting…" : "Start Game"}
                </Button>
              </div>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-2xl">Table Settings</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="danger" className="flex-1 text-destructive">Danger</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Default Buy-in ({getCurrencySymbol(editCurrency)})</Label>
                <Input type="number" value={editBuyIn} onChange={e => setEditBuyIn(e.target.value)} className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-currency">Currency</Label>
                <CurrencySelect
                  id="table-currency"
                  value={editCurrency}
                  onChange={setEditCurrency}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Members (comma separated)</Label>
                <Input value={editMembersStr} onChange={e => setEditMembersStr(e.target.value)} placeholder="Ali, Fayyad, John" className="h-11 bg-background/50" />
              </div>
              {settingsError && <p className="text-sm text-destructive">{settingsError}</p>}
              <ResponsiveDialogFooter>
                <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTable} disabled={updateTable.isPending}>
                  {updateTable.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </ResponsiveDialogFooter>
            </TabsContent>

            <TabsContent value="danger" className="pt-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-destructive">Delete Table</p>
                <p className="text-xs text-muted-foreground">This permanently deletes the table and all its sessions. There is no undo.</p>
                <Button variant="destructive" className="w-full" onClick={handleDeleteTable} disabled={deleteTable.isPending}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
