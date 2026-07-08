import { History } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatAuditTimestamp } from "@/lib/formatDate"
import { useSessionAuditLog } from "@/lib/queries"

const ACTION_LABELS = {
  session_created: "Started",
  date_changed: "Date changed",
  buy_in_added: "Buy-in",
  player_added: "Player joined",
  session_completed: "Completed",
  session_completed_with_discrepancy: "Completed with discrepancy",
}

function actionVariant(action) {
  if (action === "session_completed_with_discrepancy") return "destructive"
  if (action === "session_completed") return "default"
  return "secondary"
}

export default function SessionAuditLog({ sessionId }) {
  const { data: entries = [], isLoading } = useSessionAuditLog(sessionId)

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-bold">Activity</h2>
      </div>

      {isLoading && !entries.length ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading activity…</CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">No activity recorded yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={actionVariant(entry.action)}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatAuditTimestamp(entry.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{entry.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
