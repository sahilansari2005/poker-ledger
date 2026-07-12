import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog"
import { formatSessionDate } from "@/lib/formatDate"
import { useCreateRequest } from "@/lib/queries"

export default function RaiseRequestDialog({ tableId, sessions = [], open, onOpenChange }) {
  const createRequest = useCreateRequest(tableId)
  const [sessionId, setSessionId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleOpenChange = (next) => {
    if (next) {
      setSessionId("")
      setMessage("")
      setError("")
    }
    onOpenChange(next)
  }

  const handleSubmit = () => {
    setError("")
    createRequest.mutate(
      { session: sessionId ? Number(sessionId) : null, message: message.trim() },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      }
    )
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl">Raise a request</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Think something's wrong? Describe it and the table admin will review it.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request-session">Session (optional)</Label>
            <select
              id="request-session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
            >
              <option value="">Whole table</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSessionDate(s.date)} {s.is_completed ? "(done)" : "(active)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="request-message">What's wrong?</Label>
            <textarea
              id="request-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. My buy-in on this session should be 20, not 40."
              className="w-full rounded-md border border-input bg-background/50 p-3 text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="h-11"
            onClick={handleSubmit}
            disabled={!message.trim() || createRequest.isPending}
          >
            {createRequest.isPending ? "Sending…" : "Send request"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
