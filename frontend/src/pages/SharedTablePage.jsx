import { useNavigate, useParams } from "react-router-dom"
import { Eye, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/currency"
import { useJoinTable, useSharedTable } from "@/lib/queries"
import Leaderboard from "@/components/table/Leaderboard"
import SessionsList from "@/components/table/SessionsList"

export default function SharedTablePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useSharedTable(token)
  const joinTable = useJoinTable(token)

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <Card className="w-full max-w-sm p-8 text-center">
          <Users className="mx-auto mb-4 size-12 opacity-50" />
          <h2 className="mb-2 text-xl font-bold">Link not found</h2>
          <p className="text-sm text-muted-foreground">
            This share link is invalid or has been revoked by the table admin.
          </p>
        </Card>
      </div>
    )
  }

  const { table, sessions, viewer } = data

  const handleJoin = () => {
    joinTable.mutate(undefined, {
      onSuccess: (result) => navigate(`/table/${result.table_id}`),
    })
  }

  const cta = viewer.is_owner || viewer.is_member ? (
    <Button className="h-11 rounded-xl" onClick={() => navigate(`/table/${table.id}`)}>
      Open table
    </Button>
  ) : viewer.is_authenticated ? (
    <Button className="h-11 rounded-xl" onClick={handleJoin} disabled={joinTable.isPending}>
      {joinTable.isPending ? "Joining…" : "Join table"}
    </Button>
  ) : (
    <Button
      className="h-11 rounded-xl"
      onClick={() => navigate(`/login?next=/shared/${token}`)}
    >
      Log in to join
    </Button>
  )

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4 pb-16">
      <header className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="size-3.5" />
          <span>Shared ledger · view only</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{table.name}</h1>
            <p className="text-sm text-muted-foreground">
              {(table.members || []).length} players
            </p>
          </div>
          {cta}
        </div>
      </header>

      <Leaderboard
        members={table.members || []}
        sessions={sessions}
        transfers={table.transfers || []}
        currency={table.currency}
      />

      {(table.transfers || []).length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Cash transfers</h2>
            <Badge variant="outline" className="text-xs">Off-table</Badge>
          </div>
          <Card>
            <CardContent className="divide-y divide-border/30 p-0">
              {table.transfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between gap-3 p-4 text-sm">
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Sessions</h2>
          <Badge variant="secondary">{sessions.length}</Badge>
        </div>
        <SessionsList sessions={sessions} readOnly linkable={false} emptyMessage="No sessions recorded yet." />
      </section>
    </div>
  )
}
