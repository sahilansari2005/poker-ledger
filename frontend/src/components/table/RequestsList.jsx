import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatAuditTimestamp } from "@/lib/formatDate"
import { useResolveRequest } from "@/lib/queries"

const STATUS_VARIANTS = {
  open: "default",
  resolved: "secondary",
  rejected: "outline",
}

function RequestItem({ request, tableId, canResolve }) {
  const resolveRequest = useResolveRequest(tableId)
  const [note, setNote] = useState("")
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState("")

  const submit = (status) => {
    setError("")
    resolveRequest.mutate(
      { requestId: request.id, status, resolutionNote: note.trim() },
      { onError: (err) => setError(err.message) }
    )
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{request.requester_email || "Member"}</p>
          <p className="text-xs text-muted-foreground">{formatAuditTimestamp(request.created_at)}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[request.status] || "outline"} className="shrink-0 capitalize">
          {request.status}
        </Badge>
      </div>
      <p className="text-sm">{request.message}</p>
      {request.resolution_note && (
        <p className="rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">
          Admin note: {request.resolution_note}
        </p>
      )}
      {canResolve && request.status === "open" && (
        <div className="space-y-2">
          {resolving && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for the requester…"
              className="w-full rounded-md border border-input bg-background/50 p-2 text-sm"
            />
          )}
          <div className="flex gap-2">
            {resolving ? (
              <>
                <Button size="sm" onClick={() => submit("resolved")} disabled={resolveRequest.isPending}>
                  Resolve
                </Button>
                <Button size="sm" variant="outline" onClick={() => submit("rejected")} disabled={resolveRequest.isPending}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResolving(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setResolving(true)}>
                Respond
              </Button>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default function RequestsList({ requests, tableId, canResolve = false }) {
  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 py-8 text-center text-sm text-muted-foreground">
        No requests yet.
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border/30 p-0">
        {requests.map((request) => (
          <RequestItem key={request.id} request={request} tableId={tableId} canResolve={canResolve} />
        ))}
      </CardContent>
    </Card>
  )
}
