import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Play, TrendingUp, TrendingDown, Users, Settings, Trash2, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { todayIsoDate } from "@/lib/formatDate"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"
import {
  useTable,
  useTableSessions,
  useCreateSession,
  useUpdateTable,
  useDeleteTable,
} from "@/lib/queries"
import CurrencySelect from "@/components/CurrencySelect"
import { profitLossClass } from "@/lib/utils"
import SessionDateEdit from "@/components/session/SessionDateEdit"
import PageHeader from "@/components/layout/PageHeader"
import StickyActionBar from "@/components/layout/StickyActionBar"

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessionSortOrder, savePreferences } = useUserPreferences()

  const { data: table, isLoading: tableLoading } = useTable(id)
  const [sessionSort, setSessionSort] = useState(sessionSortOrder)
  const { data: sessions = [], isLoading: sessionsLoading } = useTableSessions(id, sessionSort)
  const createSession = useCreateSession(id)
  const updateTable = useUpdateTable(id)
  const deleteTable = useDeleteTable(id)

  const [sessionsListRef] = useAnimatedList()

  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [sessionDate, setSessionDate] = useState(() => todayIsoDate())

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState("general")
  const [editName, setEditName] = useState("")
  const [editBuyIn, setEditBuyIn] = useState("")
  const [editMembersStr, setEditMembersStr] = useState("")
  const [editCurrency, setEditCurrency] = useState("GBP")
  const [settingsError, setSettingsError] = useState("")

  useEffect(() => {
    setSessionSort(sessionSortOrder)
  }, [sessionSortOrder])

  const loading = tableLoading && !table

  if (loading) return null

  if (!table) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <Users className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-section mb-2">Table not found</h2>
        <Button variant="outline" onClick={() => navigate("/tables")}>Go back home</Button>
      </Card>
    </div>
  )

  const members = table.members || []

  const handleOpenNewSession = () => {
    setSelectedMembers(members.map(m => m.name))
    setSessionDate(todayIsoDate())
    setIsStartDialogOpen(true)
  }

  const toggleMember = (name) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleStartSession = () => {
    if (selectedMembers.length === 0) return

    createSession.mutate(
      { playerNames: selectedMembers, date: sessionDate },
      {
        onSuccess: (newSession) => {
          setIsStartDialogOpen(false)
          navigate(`/session/${newSession.id}`)
        },
      }
    )
  }

  const openSettings = () => {
    setEditName(table.name)
    setEditBuyIn(String(table.default_buy_in))
    setEditMembersStr(members.map(m => m.name).join(", "))
    setEditCurrency(table.currency || "GBP")
    setSettingsError("")
    setSettingsTab("general")
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
      onSuccess: () => navigate("/tables"),
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

  ;(table.transfers || []).forEach((transfer) => {
    const amount = parseFloat(transfer.amount)
    if (playerStats[transfer.from_player]) {
      playerStats[transfer.from_player].totalProfit -= amount
    }
    if (playerStats[transfer.to_player]) {
      playerStats[transfer.to_player].totalProfit += amount
    }
  })

  const toggleSessionSort = () => {
    const next = sessionSort === "desc" ? "asc" : "desc"
    setSessionSort(next)
    savePreferences({ session_sort_order: next })
  }

  const sortedMembers = [...members].sort(
    (a, b) => (playerStats[b.name]?.totalProfit || 0) - (playerStats[a.name]?.totalProfit || 0)
  )

  return (
    <div className="page-stack pb-flow">
      <PageHeader
        backTo="/tables"
        title={table.name}
        subtitle={`${members.length} players · ${formatMoney(table.default_buy_in, table.currency)} buy-in`}
        action={
          <Button variant="outline" size="icon" onClick={openSettings} aria-label="Table settings">
            <Settings className="size-4" />
          </Button>
        }
      />

      <div className="space-y-10">
        <section className="section-stack">
          <div className="flex items-center justify-between">
            <h2 className="text-section">Leaderboard</h2>
            <Badge variant="outline" className="text-xs">All-time</Badge>
          </div>
          <Card>
            <CardContent className="divide-y divide-border/40 p-0">
              {sortedMembers.map((member) => {
                const stats = playerStats[member.name]
                const isPositive = stats.totalProfit > 0
                const isNegative = stats.totalProfit < 0
                return (
                  <div key={member.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="icon-well text-sm font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="text-caption">{formatMoney(stats.totalInvested, table.currency)} invested</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 tabular-nums ${profitLossClass(stats.totalProfit)}`}>
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

        {(table.transfers || []).length > 0 && (
          <section className="section-stack">
            <div className="flex items-center justify-between">
              <h2 className="text-section">Cash transfers</h2>
              <Badge variant="outline" className="text-xs">Off-table</Badge>
            </div>
            <Card>
              <CardContent className="divide-y divide-border/40 p-0">
                {table.transfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between gap-4 p-5 text-base">
                    <p>
                      <span className="font-medium">{transfer.from_player}</span>
                      <span className="text-muted-foreground"> paid </span>
                      <span className="font-medium">{transfer.to_player}</span>
                    </p>
                    <Badge variant="secondary">{formatMoney(transfer.amount, table.currency)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        <section className="section-stack">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-section">Sessions</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 text-sm"
                onClick={toggleSessionSort}
                aria-label={sessionSort === "desc" ? "Sort oldest first" : "Sort newest first"}
              >
                {sessionSort === "desc" ? (
                  <ArrowDownWideNarrow className="size-3.5" />
                ) : (
                  <ArrowUpWideNarrow className="size-3.5" />
                )}
                {sessionSort === "desc" ? "Newest" : "Oldest"}
              </Button>
              <Badge variant="secondary">{sessions.length}</Badge>
            </div>
          </div>
          <div ref={sessionsListRef} className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={session.is_completed ? `/summary/${session.id}` : `/session/${session.id}`}
                className="block"
              >
                <Card className="ui-card-hover touch-manipulation">
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        <SessionDateEdit sessionId={session.id} tableId={id} date={session.date} />
                      </div>
                      <CardDescription className="mt-1">
                        {session.players?.length || 0} players
                      </CardDescription>
                    </div>
                    <Badge variant={!session.is_completed ? "default" : "secondary"}>
                      {!session.is_completed ? "Active" : "Done"}
                    </Badge>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {!sessionsLoading && sessions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-caption">
                No sessions yet. Start one below.
              </div>
            )}
          </div>
        </section>
      </div>

      <StickyActionBar>
        <Button size="lg" className="w-full" onClick={handleOpenNewSession}>
          <Play className="mr-2 size-4 fill-current" />
          Start Session
        </Button>
      </StickyActionBar>

      <ResponsiveDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader className="pb-2">
            <ResponsiveDialogTitle>Who&apos;s at the table?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Select the players participating in this session.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const isSelected = selectedMembers.includes(m.name)
                return (
                  <Badge key={m.id} variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 transition-all active:scale-[0.98]"
                    onClick={() => toggleMember(m.name)}>
                    {m.name}
                  </Badge>
                )
              })}
              {members.length === 0 && <p className="text-sm text-muted-foreground italic">No members. Edit the table first.</p>}
            </div>
            <div className="space-y-2 border-t border-border/20 pt-4">
              <Label htmlFor="new-session-date">Session date</Label>
              <Input
                id="new-session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="bg-card"
              />
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <span className="text-center text-sm text-muted-foreground sm:text-left">{selectedMembers.length} selected</span>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="ghost" onClick={() => setIsStartDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleStartSession} disabled={selectedMembers.length === 0 || createSession.isPending}>
                <Play className="w-4 h-4 mr-2" /> {createSession.isPending ? "Starting…" : "Start Game"}
              </Button>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Table settings</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <Tabs value={settingsTab} onValueChange={setSettingsTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="danger" className="flex-1 text-destructive">Danger</TabsTrigger>
            </TabsList>

            <ResponsiveDialogBody>
              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Default Buy-in ({getCurrencySymbol(editCurrency)})</Label>
                  <Input type="number" value={editBuyIn} onChange={e => setEditBuyIn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table-currency">Currency</Label>
                  <CurrencySelect
                    id="table-currency"
                    value={editCurrency}
                    onChange={setEditCurrency}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Members (comma separated)</Label>
                  <Input value={editMembersStr} onChange={e => setEditMembersStr(e.target.value)} placeholder="John, Jane, Daniel" />
                </div>
                {settingsError && <p className="text-sm text-destructive">{settingsError}</p>}
              </TabsContent>

              <TabsContent value="danger" className="pt-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
                  <p className="text-section text-destructive">Delete table</p>
                  <p className="text-caption">This permanently deletes the table and all its sessions. There is no undo.</p>
                  <Button variant="destructive" className="w-full" onClick={handleDeleteTable} disabled={deleteTable.isPending}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                  </Button>
                </div>
              </TabsContent>
            </ResponsiveDialogBody>
          </Tabs>
          {settingsTab === "general" && (
            <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full sm:w-auto" onClick={handleSaveTable} disabled={updateTable.isPending}>
                {updateTable.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </ResponsiveDialogFooter>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
