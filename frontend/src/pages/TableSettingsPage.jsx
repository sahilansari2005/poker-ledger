import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, ChevronDown, Copy, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CurrencySelect from "@/components/CurrencySelect"
import PageHeader from "@/components/layout/PageHeader"
import PageSkeleton from "@/components/layout/PageSkeleton"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import PlayerAnalytics from "@/components/table/PlayerAnalytics"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import NotFoundState from "@/components/layout/NotFoundState"
import { exportTableToJson } from "@/lib/tableExport"
import { cn } from "@/lib/utils"
import {
  useDeleteTable,
  useRemoveMembership,
  useRevokeShareLink,
  useRotateShareLink,
  useShareLink,
  useTable,
  useTableMemberships,
  useTableSessions,
  useUpdateTable,
} from "@/lib/queries"

export default function TableSettingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: table, isLoading: tableLoading } = useTable(id)
  const { data: sessions = [], isLoading: sessionsLoading } = useTableSessions(id)
  const updateTable = useUpdateTable(id)
  const deleteTable = useDeleteTable(id)

  const isOwner = table?.role !== "viewer"
  const { data: shareLink } = useShareLink(id, { enabled: Boolean(table) && isOwner })
  const rotateShareLink = useRotateShareLink(id)
  const revokeShareLink = useRevokeShareLink(id)
  const { data: memberships = [] } = useTableMemberships(id, { enabled: Boolean(table) && isOwner })
  const removeMembership = useRemoveMembership(id)

  const [editName, setEditName] = useState("")
  const [editMembersStr, setEditMembersStr] = useState("")
  const [editCurrency, setEditCurrency] = useState("GBP")
  const [settingsError, setSettingsError] = useState("")
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [labsOpen, setLabsOpen] = useState(false)

  useEffect(() => {
    if (!table) return
    setEditName(table.name)
    setEditMembersStr((table.members || []).map((m) => m.name).join(", "))
    setEditCurrency(table.currency || "GBP")
  }, [table])

  if (tableLoading && !table) return <PageSkeleton />
  if (!table) return <NotFoundState title="Table not found" />

  if (!isOwner) {
    return (
      <div className="page-stack pb-safe">
        <PageHeader
          backTo={`/table/${id}`}
          title="Table settings"
          subtitle="Only the table owner can change these."
        />
        <SpotlightCard className="p-5">
          <p className="text-sm text-muted-foreground">
            You have viewer access. Ask the owner if you need something changed.
          </p>
          <Button className="mt-4 w-full" variant="outline" onClick={() => navigate(`/table/${id}`)}>
            Back to table
          </Button>
        </SpotlightCard>
      </div>
    )
  }

  const shareToken = shareLink?.share_token
  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null

  const handleSaveTable = () => {
    setSettingsError("")
    setSaved(false)
    updateTable.mutate(
      {
        name: editName,
        memberNames: editMembersStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        currency: editCurrency,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
        onError: (err) => setSettingsError(err.message),
      }
    )
  }

  const handleDeleteTable = () => {
    deleteTable.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteOpen(false)
        navigate("/tables")
      },
      onError: (err) => setSettingsError(err.message),
    })
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable; the URL is visible for manual copying.
    }
  }

  return (
    <div className="page-stack ui-stagger pb-safe">
      <PageHeader
        backTo={`/table/${id}`}
        title="Table settings"
        subtitle={table.name}
      />

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">General</h2>
            <p className="text-sm text-muted-foreground">
              Name, currency, and the regulars on this table.
            </p>
          </div>
          <SectionPill text="Table" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Table name</Label>
            <Input
              id="table-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-11 bg-background/50"
            />
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
            <Label htmlFor="table-members">Members</Label>
            <Input
              id="table-members"
              value={editMembersStr}
              onChange={(e) => setEditMembersStr(e.target.value)}
              placeholder="John, Jane, Daniel"
              className="h-11 bg-background/50"
            />
            <p className="text-caption">Comma-separated names for who usually plays.</p>
          </div>
          {settingsError && <p className="text-sm text-destructive">{settingsError}</p>}
          {saved && <p className="text-sm text-primary">Saved.</p>}
          <Button className="w-full" size="lg" onClick={handleSaveTable} disabled={updateTable.isPending}>
            {updateTable.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Export</h2>
            <p className="text-sm text-muted-foreground">
              Download this table as JSON. You can re-import it from Settings.
            </p>
          </div>
          <SectionPill text="Backup" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          size="lg"
          onClick={() => exportTableToJson(table, sessions)}
          disabled={sessionsLoading}
        >
          <Download className="mr-2 size-4" />
          Export JSON
        </Button>
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Share link</h2>
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view the ledger. Logged-in users can join as viewers.
            </p>
          </div>
          <SectionPill text="Sharing" />
        </div>
        {shareUrl ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-11 bg-background/50 text-xs"
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={handleCopyShareUrl}
                aria-label="Copy share link"
              >
                {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-11 flex-1"
                onClick={() => rotateShareLink.mutate()}
                disabled={rotateShareLink.isPending}
              >
                Regenerate link
              </Button>
              <Button
                variant="ghost"
                className="h-11 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => revokeShareLink.mutate()}
                disabled={revokeShareLink.isPending}
              >
                Disable sharing
              </Button>
            </div>
            <p className="text-caption">
              Regenerating invalidates the old link. Existing members keep their access.
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => rotateShareLink.mutate()}
            disabled={rotateShareLink.isPending}
          >
            {rotateShareLink.isPending ? "Generating…" : "Generate share link"}
          </Button>
        )}
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">People with access</h2>
            <p className="text-sm text-muted-foreground">
              Viewers who joined through your share link.
            </p>
          </div>
          <SectionPill text="Access" />
        </div>
        {memberships.length === 0 ? (
          <p className="text-caption">No one has joined via the link yet.</p>
        ) : (
          <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50">
            {memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between gap-3 bg-card/40 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{membership.user_email}</p>
                  <p className="text-caption capitalize">{membership.role}</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-11 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeMembership.mutate(membership.id)}
                  disabled={removeMembership.isPending}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 border-destructive/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-destructive">Delete table</h2>
            <p className="text-sm text-muted-foreground">
              Permanently deletes this table and all its sessions. There is no undo.
            </p>
          </div>
          <SectionPill text="Danger" />
        </div>
        <Button
          variant="destructive"
          className="w-full"
          size="lg"
          onClick={() => setIsDeleteOpen(true)}
          disabled={deleteTable.isPending}
        >
          <Trash2 className="mr-2 size-4" />
          Delete table
        </Button>
      </SpotlightCard>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this table?"
        description="This permanently deletes the table and all its sessions. There is no undo."
        confirmLabel="Delete table"
        destructive
        pending={deleteTable.isPending}
        onConfirm={handleDeleteTable}
      />

      {/* Hidden labs: player analytics — not part of the beta surface yet */}
      <div className="pt-8 opacity-45 transition-opacity hover:opacity-80 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setLabsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-expanded={labsOpen}
        >
          <span className="tracking-wide">Labs · player stats</span>
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", labsOpen && "rotate-180")} />
        </button>
        {labsOpen && (
          <div className="mt-2 rounded-xl border border-dashed border-border/50 bg-card/30 p-4">
            <PlayerAnalytics
              members={table.members || []}
              sessions={sessions}
              transfers={table.transfers || []}
              currency={table.currency}
            />
          </div>
        )}
      </div>
    </div>
  )
}
