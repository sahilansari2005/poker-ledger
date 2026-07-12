import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardDescription } from "@/components/ui/card"
import { formatSessionDate } from "@/lib/formatDate"
import SessionDateEdit from "@/components/session/SessionDateEdit"

function SessionCard({ session, tableId, readOnly }) {
  return (
    <Card className={readOnly ? "" : "active:scale-[0.99] transition-transform touch-manipulation"}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-2">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold">
            {readOnly ? (
              formatSessionDate(session.date)
            ) : (
              <SessionDateEdit sessionId={session.id} tableId={tableId} date={session.date} />
            )}
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
  )
}

export default function SessionsList({
  sessions,
  tableId,
  readOnly = false,
  linkable = true,
  listRef,
  emptyMessage,
  showEmpty = true,
}) {
  return (
    <div ref={listRef} className="space-y-3">
      {sessions.map((session) => {
        const card = (
          <SessionCard
            session={session}
            tableId={tableId}
            readOnly={readOnly}
          />
        )
        if (!linkable) {
          return <div key={session.id}>{card}</div>
        }
        return (
          <Link
            key={session.id}
            to={session.is_completed ? `/summary/${session.id}` : `/session/${session.id}`}
            className="block"
          >
            {card}
          </Link>
        )
      })}
      {showEmpty && sessions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/40 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage || "No sessions yet."}
        </div>
      )}
    </div>
  )
}
