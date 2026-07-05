import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Users, Coins, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog"
import { loadDefaultCurrency, formatMoney } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useTables, useCreateTable } from "@/lib/queries"

export default function Dashboard() {
  const { data: tables = [] } = useTables()
  const createTable = useCreateTable()
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
        currency: loadDefaultCurrency(),
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
    <div className="space-y-6">
      <header className="space-y-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your Tables</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track buy-ins, cash-outs, and session stats</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="lg"
          className="h-12 w-full rounded-xl shadow-lg shadow-primary/20 touch-manipulation sm:w-auto"
        >
          <Plus className="mr-2 size-5" />
          Create Table
        </Button>
      </header>

      <div ref={tablesListRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ui-stagger">
        {tables.map((table) => (
          <Card key={table.id} className="ui-card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold truncate">{table.name}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" /> {table.members?.length || 0}
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  <Coins className="size-3.5" /> {formatMoney(table.default_buy_in, table.currency)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-wrap gap-1.5">
                {(table.members || []).slice(0, 4).map(m => (
                  <span key={m.id} className="rounded-md border border-border/40 bg-secondary/80 px-2 py-1 text-[10px] font-semibold">
                    {m.name}
                  </span>
                ))}
                {(table.members || []).length > 4 && (
                  <span className="rounded-md border border-border/20 bg-secondary/40 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    +{(table.members || []).length - 4}
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link to={`/table/${table.id}`} className="w-full">
                <Button variant="secondary" className="h-11 w-full rounded-xl">
                  Open Table
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed border-border bg-card px-6 py-12 text-center shadow-sm">
            <Users className="mb-3 size-10 text-muted-foreground/60" />
            <h3 className="text-lg font-bold">No Tables Yet</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Create a table to start tracking your home game.
            </p>
            <Button className="mt-5 h-11 w-full max-w-xs rounded-xl" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Table
            </Button>
          </div>
        )}
      </div>

      <ResponsiveDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-xl">New Poker Table</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Set up stakes and add members.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Friday Night Game" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyin">Default Buy-in</Label>
              <Input id="buyin" type="number" inputMode="decimal" value={buyIn} onChange={e => setBuyIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members">Members</Label>
              <Input
                id="members"
                value={membersStr}
                onChange={e => setMembersStr(e.target.value)}
                placeholder="Ali, Fayyad, John"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" className="h-11 w-full sm:w-auto" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="h-11 w-full sm:w-auto" onClick={handleCreateTable} disabled={createTable.isPending}>
              {createTable.isPending ? "Creating…" : "Create Table"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
