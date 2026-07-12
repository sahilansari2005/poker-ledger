import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Users, Coins, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog"
import PageHeader from "@/components/layout/PageHeader"
import { formatMoney } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useTables, useCreateTable } from "@/lib/queries"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

export default function Dashboard() {
  const { data: tables = [] } = useTables()
  const createTable = useCreateTable()
  const { defaultCurrency } = useUserPreferences()
  const [tablesListRef] = useAnimatedList()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [buyIn, setBuyIn] = useState("10")
  const [membersStr, setMembersStr] = useState("")
  const [error, setError] = useState("")

  const handleCreateTable = () => {
    if (!name || !buyIn) return
    setError("")

    createTable.mutate(
      {
        name,
        buyIn: parseFloat(buyIn) || 0,
        memberNames: membersStr.split(",").map(s => s.trim()).filter(Boolean),
        currency: defaultCurrency,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false)
          setName("")
          setMembersStr("")
          setBuyIn("10")
        },
        onError: (err) => setError(err.message),
      }
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Your Tables"
        subtitle="Track buy-ins, cash-outs, and session stats"
        action={
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="touch-manipulation">
            <Plus className="size-4" />
            Create
          </Button>
        }
      />

      <div className="mb-1">
        <SectionPill text="Home games" />
      </div>
      <div ref={tablesListRef} className="grid gap-5 sm:grid-cols-2 ui-stagger">
        {tables.map((table) => (
          <SpotlightCard
            key={table.id}
            className="ui-card-hover flex flex-col gap-5 py-5"
          >
            <div className="space-y-1.5 px-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-base font-semibold leading-snug">{table.name}</h3>
                {table.role === "viewer" && (
                  <Badge variant="outline" className="shrink-0">Viewer</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" /> {table.members?.length || 0}
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  <Coins className="size-4" /> {formatMoney(table.default_buy_in, table.currency)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 px-5">
              {(table.members || []).slice(0, 4).map(m => (
                <Badge key={m.id} variant="secondary">{m.name}</Badge>
              ))}
              {(table.members || []).length > 4 && (
                <Badge variant="outline">+{(table.members || []).length - 4}</Badge>
              )}
            </div>
            <div className="mt-auto border-t border-border/50 bg-muted/30 px-5 py-4">
              <Link to={`/table/${table.id}`} className="w-full">
                <Button variant="secondary" className="w-full">
                  Open table
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </SpotlightCard>
        ))}

        {tables.length === 0 && (
          <SpotlightCard className="col-span-full flex flex-col items-center border-dashed bg-card/40 px-8 py-16 text-center">
            <div className="icon-well mb-5">
              <Users className="size-5" />
            </div>
            <h3 className="text-section">No tables yet</h3>
            <p className="mt-2 max-w-xs text-caption">
              Create a table to start tracking your home game.
            </p>
            <Button className="mt-6 w-full max-w-xs" onClick={() => setIsDialogOpen(true)}>
              <Plus className="size-4" /> Create table
            </Button>
          </SpotlightCard>
        )}
      </div>

      <ResponsiveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>New poker table</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Set up stakes and add members.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Table name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Friday night game" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyin">Default buy-in</Label>
              <Input id="buyin" type="number" inputMode="decimal" value={buyIn} onChange={e => setBuyIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members">Members</Label>
              <Input
                id="members"
                value={membersStr}
                onChange={e => setMembersStr(e.target.value)}
                placeholder="John, Jane, Daniel"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleCreateTable} disabled={createTable.isPending}>
              {createTable.isPending ? "Creating…" : "Create table"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
