import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ShieldCheck, AlertCircle, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog"
import { Label } from "@/components/ui/label"
import BuyInField from "@/components/session/BuyInField"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import {
  clearSessionDraft,
  getSessionDraft,
  mergeCashOutDraft,
  setSessionDraft,
} from "@/lib/sessionDraft"
import {
  useSession,
  useAddBuyIn,
  useAddPlayer,
  useCompleteSession,
  useDeleteSession,
} from "@/lib/queries"
import { profitLossClass } from "@/lib/utils"
import PageHeader from "@/components/layout/PageHeader"
import StickyActionBar from "@/components/layout/StickyActionBar"
import SessionDateEdit from "@/components/session/SessionDateEdit"
import SessionAuditLog from "@/components/session/SessionAuditLog"

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: session, isLoading } = useSession(id)
  const addBuyIn = useAddBuyIn(id)
  const addPlayer = useAddPlayer(id)
  const completeSession = useCompleteSession(id)
  const deleteSession = useDeleteSession(id, session?.table)

  const [draftReady, setDraftReady] = useState(false)
  const [addValues, setAddValues] = useState({})
  const [isCashingOut, setIsCashingOut] = useState(false)
  const [cashOutValues, setCashOutValues] = useState({})
  const [playerListRef] = useAnimatedList()

  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [addPlayerError, setAddPlayerError] = useState("")
  const [isDiscrepancyDialogOpen, setIsDiscrepancyDialogOpen] = useState(false)

  useEffect(() => {
    const draft = getSessionDraft(id)
    setAddValues(draft?.addValues ?? {})
    setIsCashingOut(draft?.isCashingOut ?? false)
    setCashOutValues(draft?.cashOutValues ?? {})
    setDraftReady(true)
  }, [id])

  useEffect(() => {
    if (!draftReady || !id) return
    setSessionDraft(id, { addValues, isCashingOut, cashOutValues })
  }, [id, draftReady, addValues, isCashingOut, cashOutValues])

  useEffect(() => {
    if (!session?.players) return
    setCashOutValues((prev) => mergeCashOutDraft(prev, session.players))
  }, [session?.players])

  if (isLoading && !session) return null

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      <Card className="p-8 flex flex-col items-center bg-card/50 backdrop-blur-md border-border/50">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-section mb-2">Session not found</h2>
        <Button variant="outline" onClick={() => navigate("/tables")}>Go back home</Button>
      </Card>
    </div>
  )

  const currency = session.table_currency || "GBP"
  const currencySymbol = getCurrencySymbol(currency)

  const handleAddSubmit = (playerId) => {
    const amt = parseFloat(addValues[playerId])
    if (isNaN(amt) || amt <= 0) return

    addBuyIn.mutate(
      { playerId, amount: amt },
      {
        onSuccess: () => setAddValues((prev) => ({ ...prev, [playerId]: "" })),
      }
    )
  }

  const clearAddValue = (playerId) => {
    setAddValues((prev) => ({ ...prev, [playerId]: "" }))
  }

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return
    setAddPlayerError("")

    addPlayer.mutate(newPlayerName.trim(), {
      onSuccess: () => {
        setIsAddPlayerOpen(false)
        setNewPlayerName("")
      },
      onError: (err) => setAddPlayerError(err.message),
    })
  }

  const handleStartCashOut = () => {
    setCashOutValues((prev) => mergeCashOutDraft(prev, session.players))
    setIsCashingOut(true)
  }

  const totalBuyIn = session.players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)
  const totalCashOut = session.players.reduce((sum, p) => sum + (parseFloat(cashOutValues[p.id]) || 0), 0)
  const isBalanced = Math.abs(totalBuyIn - totalCashOut) < 0.01
  const remainingToDistribute = totalBuyIn - totalCashOut
  const discrepancyAmount = Math.abs(remainingToDistribute)

  const handleEndSession = (allowDiscrepancy = false) => {
    const cashOuts = session.players.map(p => ({
      player_id: p.id,
      cash_out: parseFloat(cashOutValues[p.id]) || 0,
    }))

    completeSession.mutate(
      { cashOuts, allowDiscrepancy },
      {
        onSuccess: () => {
          clearSessionDraft(id)
          setIsDiscrepancyDialogOpen(false)
          navigate(`/summary/${id}`)
        },
        onError: (err) => alert(err.message),
      }
    )
  }

  const handleCompleteClick = () => {
    if (!isBalanced) {
      setIsDiscrepancyDialogOpen(true)
      return
    }
    handleEndSession(false)
  }

  const handleDeleteSession = () => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return
    deleteSession.mutate(undefined, {
      onSuccess: () => {
        clearSessionDraft(id)
        navigate(`/table/${session.table}`, { replace: true })
      },
    })
  }

  return (
    <div className="page-stack pb-flow">
      <PageHeader
        backTo={`/table/${session.table}`}
        title={isCashingOut ? "Cash Out" : "Active Session"}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <SessionDateEdit sessionId={session.id} tableId={session.table} date={session.date} />
            <span className="text-border">·</span>
            <span>{session.players.length} players</span>
          </span>
        }
      />

      {!isCashingOut ? (
        <div ref={playerListRef} className="space-y-5">
          {session.players.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3 font-medium">
                  <div className="icon-well text-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{p.name}</span>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {formatMoney(p.total_buy_in, currency)}
                </Badge>
              </CardHeader>
              <CardContent>
                <BuyInField
                  playerId={p.id}
                  playerName={p.name}
                  currencySymbol={currencySymbol}
                  value={addValues[p.id] || ""}
                  onChange={(value) => setAddValues((prev) => ({ ...prev, [p.id]: value }))}
                  onClear={() => clearAddValue(p.id)}
                  onSubmit={() => handleAddSubmit(p.id)}
                  disabled={session.is_completed}
                  isPending={addBuyIn.isPending}
                />
              </CardContent>
            </Card>
          ))}

          {!session.is_completed && (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAddPlayerOpen(true)}>
              <UserPlus className="mr-2 size-4" /> Add Player
            </Button>
          )}
        </div>
      ) : (
        <div ref={playerListRef} className="space-y-5">
          <Card className={isBalanced ? "border-primary/30 bg-primary/8" : "border-destructive/30"}>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-5 text-center">
                <div>
                  <p className="text-caption">In play</p>
                  <p className="text-title tabular-nums">{formatMoney(totalBuyIn, currency)}</p>
                </div>
                <div>
                  <p className="text-caption">Cashed out</p>
                  <p className="text-title tabular-nums">{formatMoney(totalCashOut, currency)}</p>
                </div>
              </div>
              {!isBalanced && (
                <div className="space-y-1 text-center">
                  <p className="flex items-center justify-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="size-4" />
                    {formatMoney(discrepancyAmount, currency)} discrepancy
                  </p>
                  <p className="text-caption">
                    {remainingToDistribute > 0
                      ? `${formatMoney(remainingToDistribute, currency)} still to distribute`
                      : `${formatMoney(-remainingToDistribute, currency)} over-distributed`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {session.players.map((p) => {
            const val = parseFloat(cashOutValues[p.id]) || 0
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">In: {formatMoney(p.total_buy_in, currency)}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-caption">Cash out</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Cash out amount"
                        value={cashOutValues[p.id] || ""}
                        onChange={(e) => setCashOutValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="pl-8 font-medium"
                      />
                    </div>
                    {cashOutValues[p.id] !== "" && (
                      <p className={`text-right text-sm font-medium ${profitLossClass(val - parseFloat(p.total_buy_in))}`}>
                        Net: {val - parseFloat(p.total_buy_in) > 0 ? "+" : ""}{formatMoney(val - parseFloat(p.total_buy_in), currency)}
                      </p>
                    )}
                  </div>
                  <BuyInField
                    playerId={p.id}
                    playerName={p.name}
                    currencySymbol={currencySymbol}
                    value={addValues[p.id] || ""}
                    onChange={(value) => setAddValues((prev) => ({ ...prev, [p.id]: value }))}
                    onClear={() => clearAddValue(p.id)}
                    onSubmit={() => handleAddSubmit(p.id)}
                    disabled={session.is_completed}
                    isPending={addBuyIn.isPending}
                    compact
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!session.is_completed && (
        <StickyActionBar>
          {!isCashingOut ? (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleDeleteSession} aria-label="Delete session">
                <Trash2 className="size-4" />
              </Button>
              <Button size="lg" className="flex-1" variant="destructive" onClick={handleStartCashOut}>
                <ShieldCheck className="mr-2 size-4" />
                Cash Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsCashingOut(false)}>
                Back to buy-ins
              </Button>
              <Button
                size="lg"
                className="flex-1"
                variant={!isBalanced ? "destructive" : "default"}
                onClick={handleCompleteClick}
                disabled={completeSession.isPending}
              >
                <ShieldCheck className="mr-2 size-4" />
                {isBalanced ? "Complete" : "Complete anyway"}
              </Button>
            </div>
          )}
        </StickyActionBar>
      )}

      <SessionAuditLog sessionId={session.id} />

      <ResponsiveDialog open={isDiscrepancyDialogOpen} onOpenChange={setIsDiscrepancyDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-sm">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Session doesn&apos;t balance</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Buy-ins and cash-outs don&apos;t match. Are you sure you want to close this session with{" "}
              <span className="font-semibold text-destructive">{formatMoney(discrepancyAmount, currency)}</span> in discrepancy?
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 text-center text-sm">
            <div className="rounded-xl bg-muted/40 p-4 text-center">
              <p className="text-caption">In play</p>
              <p className="font-medium tabular-nums">{formatMoney(totalBuyIn, currency)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 text-center">
              <p className="text-caption">Cashed out</p>
              <p className="font-medium tabular-nums">{formatMoney(totalCashOut, currency)}</p>
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button variant="ghost" onClick={() => setIsDiscrepancyDialogOpen(false)}>Go back</Button>
            <Button
              variant="destructive"
              onClick={() => handleEndSession(true)}
              disabled={completeSession.isPending}
            >
              {completeSession.isPending ? "Closing…" : "Close session anyway"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <ResponsiveDialogContent className="sm:max-w-sm">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Add Player</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Add a late-arriving player to this session.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-3 py-2">
            <Label>Player Name</Label>
            <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Their name"
              onKeyDown={e => e.key === "Enter" && handleAddPlayer()} autoFocus />
            {addPlayerError && <p className="text-sm text-destructive">{addPlayerError}</p>}
          </div>
          <ResponsiveDialogFooter>
            <Button variant="ghost" onClick={() => setIsAddPlayerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim() || addPlayer.isPending}>
              {addPlayer.isPending ? "Adding…" : "Add Player"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
