import { useEffect, useState } from "react"
import { Calendar, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { formatSessionDate } from "@/lib/formatDate"
import { useUpdateSession } from "@/lib/queries"

export default function SessionDateEdit({ sessionId, tableId, date }) {
  const updateSession = useUpdateSession(sessionId, tableId)
  const [open, setOpen] = useState(false)
  const [editDate, setEditDate] = useState(date)
  const [displayDate, setDisplayDate] = useState(date)
  const [error, setError] = useState("")

  useEffect(() => {
    setEditDate(date)
    setDisplayDate(date)
  }, [date])

  const commitDate = (nextDate) => {
    if (!nextDate) {
      setError("Pick a date.")
      return
    }
    if (nextDate === displayDate) {
      setOpen(false)
      return
    }

    setError("")
    setDisplayDate(nextDate)
    setOpen(false)
    updateSession.mutate(nextDate, {
      onError: (err) => {
        setDisplayDate(date)
        setError(err.message)
        setOpen(true)
        setEditDate(nextDate)
      },
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setError("")
          setEditDate(displayDate)
          setOpen(true)
        }}
        className="inline-flex items-center gap-1.5 rounded-lg text-left text-muted-foreground transition-colors hover:text-foreground"
      >
        <Calendar className="size-3.5 shrink-0" />
        <span>{formatSessionDate(displayDate)}</span>
        <Pencil className="size-3 opacity-60" />
      </button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Session date</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={`session-date-${sessionId}`}>Date</Label>
            <Input
              id={`session-date-${sessionId}`}
              type="date"
              value={editDate}
              onChange={(e) => commitDate(e.target.value)}
              className="h-11 bg-background/50"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}
