import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Play, Users, Settings, ArrowDownWideNarrow, ArrowUpWideNarrow, MessageSquarePlus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatMoney } from "@/lib/currency"
import { todayIsoDate } from "@/lib/formatDate"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"
import {
  useTable,
  useTableSessions,
  useCreateSession,
  useTableRequests,
  useLeaveTable,
} from "@/lib/queries"
import PageHeader from "@/components/layout/PageHeader"
import PageSkeleton from "@/components/layout/PageSkeleton"
import Leaderboard from "@/components/table/Leaderboard"
import SessionsList from "@/components/table/SessionsList"
import RaiseRequestDialog from "@/components/table/RaiseRequestDialog"
import RequestsList from "@/components/table/RequestsList"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

export default function TablePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessionSortOrder, savePreferences } = useUserPreferences()

  const { data: table, isLoading: tableLoading } = useTable(id)
  const [sessionSort, setSessionSort] = useState(sessionSortOrder)
  const { data: sessions = [], isLoading: sessionsLoading } = useTableSessions(id, sessionSort)
  const createSession = useCreateSession(id)

  const isOwner = table?.role !== "viewer"

  const { data: requests = [] } = useTableRequests(id, { enabled: Boolean(table) })

  const [sessionsListRef] = useAnimatedList()

  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [sessionDate, setSessionDate] = useState(() => todayIsoDate())

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const leaveTable = useLeaveTable(id)

  useEffect(() => {
    setSessionSort(sessionSortOrder)
  }, [sessionSortOrder])

  const loading = tableLoading && !table

  if (loading) return <PageSkeleton />

  if (!table) return (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      <Card className="flex flex-col items-center border-border/50 bg-card/50 p-8 backdrop-blur-md">
        <Users className="mb-4 size-12 opacity-50" />
        <h2 className="text-section mb-2">Table not found</h2>
        <Button variant="outline" onClick={() => navigate("/tables")}>Go back home</Button>
      </Card>
    </div>
  )

  const members = table.members || []
  const openRequestCount = requests.filter((r) => r.status === "open").length

  const handleOpenNewSession = () => {
    setSelectedMembers([])
    setSessionDate(todayIsoDate())
    setIsStartDialogOpen(true)
  }

  const toggleMember = (name) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
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

  const toggleSessionSort = () => {
    const next = sessionSort === "desc" ? "asc" : "desc"
    setSessionSort(next)
    savePreferences({ session_sort_order: next })
  }

  return (
    <div className="page-stack pb-safe">
      <PageHeader
        backTo="/tables"
        title={table.name}
        subtitle={
          isOwner
            ? `${members.length} players`
            : `${members.length} players · Owned by ${table.owner_name || table.owner_email || "admin"}`
        }
        action={
          isOwner ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/table/${id}/settings`)}
              aria-label="Table settings"
            >
              <Settings className="size-4" />
            </Button>
          ) : (
            <Badge variant="outline">Viewer</Badge>
          )
        }
      />

      {isOwner && (
        <Button size="lg" className="h-12 w-full rounded-xl" onClick={handleOpenNewSession}>
          <Play className="mr-2 size-4 fill-current" />
          Start Session
        </Button>
      )}

      <div className="space-y-8">
        <Leaderboard
          members={members}
          sessions={sessions}
          transfers={table.transfers || []}
          currency={table.currency}
        />

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

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-section">Sessions</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 gap-1.5 rounded-xl"
                onClick={toggleSessionSort}
                aria-label={`Sort sessions ${sessionSort === "desc" ? "oldest first" : "newest first"}`}
              >
                {sessionSort === "desc" ? (
                  <ArrowDownWideNarrow className="size-4" />
                ) : (
                  <ArrowUpWideNarrow className="size-4" />
                )}
                {sessionSort === "desc" ? "Newest" : "Oldest"}
              </Button>
              <Badge variant="secondary">{sessions.length}</Badge>
            </div>
          </div>
          <SessionsList
            sessions={sessions}
            tableId={id}
            readOnly={!isOwner}
            listRef={sessionsListRef}
            showEmpty={!sessionsLoading}
            emptyMessage={isOwner ? "No sessions yet. Start one above." : "No sessions yet."}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-section">Requests</h2>
              {openRequestCount > 0 && <Badge>{openRequestCount} open</Badge>}
            </div>
            {!isOwner && (
              <Button
                variant="outline"
                className="h-11 min-h-11 gap-1.5 rounded-xl"
                onClick={() => setIsRequestDialogOpen(true)}
              >
                <MessageSquarePlus className="size-4" />
                Raise a request
              </Button>
            )}
          </div>
          <RequestsList requests={requests} tableId={id} canResolve={isOwner} />
        </section>

        {!isOwner && (
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={leaveTable.isPending}
            onClick={() => setIsLeaveOpen(true)}
          >
            <LogOut className="mr-2 size-4" />
            {leaveTable.isPending ? "Leaving…" : "Leave table"}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={isLeaveOpen}
        onOpenChange={setIsLeaveOpen}
        title="Leave this table?"
        description="You will lose viewer access until you join again via the share link."
        confirmLabel="Leave table"
        destructive
        pending={leaveTable.isPending}
        onConfirm={() => {
          leaveTable.mutate(undefined, {
            onSuccess: () => navigate("/tables", { replace: true }),
          })
        }}
      />

      <RaiseRequestDialog
        tableId={id}
        sessions={sessions}
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />

      <ResponsiveDialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <ResponsiveDialogContent className="border-border/50 bg-card/80 backdrop-blur-xl sm:max-w-lg">
          <ResponsiveDialogHeader className="pb-2">
            <ResponsiveDialogTitle>Who&apos;s at the table?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Select the players participating in this session.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const isSelected = selectedMembers.includes(m.name)
                return (
                  <Badge
                    key={m.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 transition-all active:scale-[0.98]"
                    onClick={() => toggleMember(m.name)}
                  >
                    {m.name}
                  </Badge>
                )
              })}
              {members.length === 0 && (
                <p className="text-sm italic text-muted-foreground">No members. Edit the table first.</p>
              )}
            </div>
            <div className="space-y-2 border-t border-border/20 pt-4">
              <Label htmlFor="new-session-date">Session date</Label>
              <Input
                id="new-session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="h-11 bg-card"
              />
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <span className="text-center text-sm text-muted-foreground sm:text-left">
              {selectedMembers.length} selected
            </span>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="ghost" onClick={() => setIsStartDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleStartSession} disabled={selectedMembers.length === 0 || createSession.isPending}>
                <Play className="mr-2 size-4" /> {createSession.isPending ? "Starting…" : "Start Game"}
              </Button>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
