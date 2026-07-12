import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { CheckCircle2, AlertCircle, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import { useSession, useAdjustSession } from "@/lib/queries"
import PageHeader from "@/components/layout/PageHeader"
import PageSkeleton from "@/components/layout/PageSkeleton"
import SessionDateEdit from "@/components/session/SessionDateEdit"
import SessionSettlement from "@/components/session/SessionSettlement"
import SessionAuditLog from "@/components/session/SessionAuditLog"

function draftFromPlayers(players) {
  const draft = {}
  for (const p of players || []) {
    draft[p.id] = {
      buyIn: p.total_buy_in != null ? String(p.total_buy_in) : "",
      cashOut: p.cash_out != null ? String(p.cash_out) : "",
    }
  }
  return draft
}

export default function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: session, isLoading } = useSession(id)
  const adjustSession = useAdjustSession(id, session?.table)
  const [standingsRef] = useAnimatedList()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [editError, setEditError] = useState("")
  const [isDiscrepancyDialogOpen, setIsDiscrepancyDialogOpen] = useState(false)

  useEffect(() => {
    if (!session?.players || isEditing) return
    setDraft(draftFromPlayers(session.players))
  }, [session?.players, isEditing])

  if (isLoading && !session) return <PageSkeleton />

  if (!session) return (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      <Card className="flex flex-col items-center p-8">
        <AlertCircle className="mb-4 size-12 opacity-50" />
        <h2 className="text-section mb-2">Summary not found</h2>
        <Button variant="outline" onClick={() => navigate("/tables")}>Go back home</Button>
      </Card>
    </div>
  )

  const canEdit = session.can_edit !== false
  const players = session.players || []
  const currency = session.table_currency || "GBP"
  const currencySymbol = getCurrencySymbol(currency)
  const totalPot = players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)

  const sortedPlayers = [...players].sort((a, b) => {
    const profitA = (parseFloat(a.cash_out) || 0) - parseFloat(a.total_buy_in)
    const profitB = (parseFloat(b.cash_out) || 0) - parseFloat(b.total_buy_in)
    return profitB - profitA
  })

  const biggestWinner = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[0].cash_out) || 0) - parseFloat(sortedPlayers[0].total_buy_in)) > 0 ? sortedPlayers[0] : null
  const biggestLoser = sortedPlayers.length > 0 && ((parseFloat(sortedPlayers[sortedPlayers.length - 1].cash_out) || 0) - parseFloat(sortedPlayers[sortedPlayers.length - 1].total_buy_in)) < 0 ? sortedPlayers[sortedPlayers.length - 1] : null

  const startEditing = () => {
    setDraft(draftFromPlayers(players))
    setEditError("")
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditError("")
    setDraft(draftFromPlayers(players))
  }

  const updateDraft = (playerId, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }))
  }

  const draftTotals = players.reduce(
    (acc, p) => {
      const row = draft[p.id] || {}
      acc.buyIn += parseFloat(row.buyIn) || 0
      acc.cashOut += parseFloat(row.cashOut) || 0
      return acc
    },
    { buyIn: 0, cashOut: 0 },
  )
  const remaining = draftTotals.buyIn - draftTotals.cashOut
  const isBalanced = Math.abs(remaining) < 0.01
  const discrepancyAmount = Math.abs(remaining)

  const buildPayload = () =>
    players.map((p) => ({
      player_id: p.id,
      total_buy_in: parseFloat(draft[p.id]?.buyIn) || 0,
      cash_out: parseFloat(draft[p.id]?.cashOut) || 0,
    }))

  const saveAdjust = (allowDiscrepancy = false) => {
    setEditError("")
    adjustSession.mutate(
      { players: buildPayload(), allowDiscrepancy },
      {
        onSuccess: () => {
          setIsEditing(false)
          setIsDiscrepancyDialogOpen(false)
        },
        onError: (err) => {
          setEditError(err.message)
          setIsDiscrepancyDialogOpen(false)
        },
      },
    )
  }

  const handleSaveClick = () => {
    for (const p of players) {
      const buyIn = draft[p.id]?.buyIn
      const cashOut = draft[p.id]?.cashOut
      if (buyIn === "" || cashOut === "" || Number.isNaN(parseFloat(buyIn)) || Number.isNaN(parseFloat(cashOut))) {
        setEditError("Enter a buy-in and cash-out for every player.")
        return
      }
      if (parseFloat(buyIn) < 0 || parseFloat(cashOut) < 0) {
        setEditError("Amounts cannot be negative.")
        return
      }
    }
    if (!isBalanced) {
      setIsDiscrepancyDialogOpen(true)
      return
    }
    saveAdjust(false)
  }

  return (
    <div className="page-stack pb-safe">
      <PageHeader
        backTo={`/table/${session.table}`}
        title="Session summary"
        subtitle={
          <SessionDateEdit
            sessionId={session.id}
            tableId={session.table}
            date={session.date}
            readOnly={!canEdit}
          />
        }
        action={
          canEdit && !isEditing ? (
            <Button variant="outline" className="h-11 min-h-11 gap-1.5 rounded-xl" onClick={startEditing}>
              <Pencil className="size-4" />
              Edit amounts
            </Button>
          ) : null
        }
      />

      {!isEditing && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Pot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatMoney(totalPot, currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{players.length} players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Biggest Winner</CardTitle>
            </CardHeader>
            <CardContent>
              {biggestWinner ? (
                <>
                  <p className="text-xl font-bold truncate">{biggestWinner.name}</p>
                  <Badge className="mt-2" variant="outline">
                    +{formatMoney((parseFloat(biggestWinner.cash_out) || 0) - parseFloat(biggestWinner.total_buy_in), currency)}
                  </Badge>
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Biggest Loser</CardTitle>
            </CardHeader>
            <CardContent>
              {biggestLoser ? (
                <>
                  <p className="text-xl font-bold truncate">{biggestLoser.name}</p>
                  <Badge className="mt-2" variant="outline">
                    {formatMoney((parseFloat(biggestLoser.cash_out) || 0) - parseFloat(biggestLoser.total_buy_in), currency)}
                  </Badge>
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isEditing ? "Edit amounts" : "Final Standings"}</h2>
          {isEditing && (
            <Badge variant={isBalanced ? "outline" : "destructive"}>
              {isBalanced ? "Balanced" : `${formatMoney(discrepancyAmount, currency)} off`}
            </Badge>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {players.map((p) => {
              const buyIn = parseFloat(draft[p.id]?.buyIn) || 0
              const cashOut = parseFloat(draft[p.id]?.cashOut) || 0
              const net = cashOut - buyIn
              return (
                <Card key={p.id}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Buy-in</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={draft[p.id]?.buyIn ?? ""}
                          onChange={(e) => updateDraft(p.id, "buyIn", e.target.value)}
                          className="h-11 pl-8 font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Cash out</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={draft[p.id]?.cashOut ?? ""}
                          onChange={(e) => updateDraft(p.id, "cashOut", e.target.value)}
                          className="h-11 pl-8 font-semibold"
                        />
                      </div>
                    </div>
                    <p className={`text-xs font-semibold sm:col-span-2 ${net > 0 ? "text-emerald-600" : net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      Net: {net > 0 ? "+" : ""}{formatMoney(net, currency)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}

            <Card className={isBalanced ? "border-primary/40 bg-primary/5" : "border-destructive/30"}>
              <CardContent className="grid grid-cols-2 gap-4 p-4 text-center">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Buy-ins</p>
                  <p className="text-xl font-bold">{formatMoney(draftTotals.buyIn, currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Cash-outs</p>
                  <p className="text-xl font-bold">{formatMoney(draftTotals.cashOut, currency)}</p>
                </div>
              </CardContent>
            </Card>

            {editError && <p className="text-sm text-destructive">{editError}</p>}

            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={cancelEditing} disabled={adjustSession.isPending}>
                Cancel
              </Button>
              <Button className="h-11 flex-1 rounded-xl" onClick={handleSaveClick} disabled={adjustSession.isPending}>
                {adjustSession.isPending ? "Saving…" : isBalanced ? "Save changes" : "Save anyway"}
              </Button>
            </div>
          </div>
        ) : (
          <div ref={standingsRef} className="space-y-3">
            {sortedPlayers.map((p, i) => {
              const cashOut = parseFloat(p.cash_out) || 0
              const totalBuyIn = parseFloat(p.total_buy_in)
              const profitLoss = cashOut - totalBuyIn
              const isPositive = profitLoss > 0
              const isNegative = profitLoss < 0

              return (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs">{i + 1}</span>
                      {p.name}
                    </CardTitle>
                    <Badge variant="outline" className={isPositive ? "text-emerald-600" : isNegative ? "text-destructive" : ""}>
                      {isPositive ? "+" : ""}{formatMoney(profitLoss, currency)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 px-4 pb-4 text-center text-sm">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Buy-in</p>
                      <p className="font-bold">{formatMoney(totalBuyIn, currency)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Cashed</p>
                      <p className="font-bold">{formatMoney(cashOut, currency)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {!isEditing && <SessionSettlement settlements={session.settlements} currency={currency} />}

      <SessionAuditLog sessionId={session.id} />

      <Button className="w-full" size="lg" variant="outline" onClick={() => navigate(`/table/${session.table}`)}>
        <CheckCircle2 className="size-4" /> Back to table
      </Button>

      <ResponsiveDialog open={isDiscrepancyDialogOpen} onOpenChange={setIsDiscrepancyDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Amounts don&apos;t balance</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Buy-ins and cash-outs don&apos;t match. Save with{" "}
              <span className="font-semibold text-destructive">{formatMoney(discrepancyAmount, currency)}</span> discrepancy?
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="ghost" onClick={() => setIsDiscrepancyDialogOpen(false)}>Go back</Button>
            <Button
              variant="destructive"
              onClick={() => saveAdjust(true)}
              disabled={adjustSession.isPending}
            >
              {adjustSession.isPending ? "Saving…" : "Save anyway"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
