import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ShieldCheck, AlertCircle, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import MoneyInput from "@/components/ui/MoneyInput"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { Label } from "@/components/ui/label"
import BuyInField from "@/components/session/BuyInField"
import DiscrepancyDialog from "@/components/session/DiscrepancyDialog"
import { formatMoney, getCurrencySymbol } from "@/lib/currency"
import { useAnimatedList } from "@/lib/hooks/useAnimatedList"
import {
  clearSessionDraft,
  getSessionDraft,
  mergeCashOutDraft,
  setSessionDraft,
} from "@/lib/sessionDraft"
import {
  buildCashOutPayload,
  computeBalance,
  toAmount,
} from "@/lib/sessionBalance"
import {
  useSession,
  useAddBuyIn,
  useAddPlayer,
  useCompleteSession,
  useDeleteSession,
} from "@/lib/queries"
import { cn, profitLossClass } from "@/lib/utils"
import NotFoundState from "@/components/layout/NotFoundState"
import PageHeader from "@/components/layout/PageHeader"
import PageSkeleton from "@/components/layout/PageSkeleton"
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [completeError, setCompleteError] = useState("")

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

  if (isLoading && !session) return <PageSkeleton />
  if (!session) return <NotFoundState title="Session not found" />

  const canEdit = session.can_edit !== false
  const showStickyBar = canEdit && !session.is_completed
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
    setCompleteError("")
  }

  const {
    buyIn: totalBuyIn,
    cashOut: totalCashOut,
    isBalanced,
    remaining: remainingToDistribute,
    discrepancyAmount,
  } = computeBalance(
    session.players,
    (player) => player.total_buy_in,
    (player) => cashOutValues[player.id],
  )

  const handleEndSession = (allowDiscrepancy = false) => {
    setCompleteError("")

    completeSession.mutate(
      {
        cashOuts: buildCashOutPayload(session.players, cashOutValues),
        allowDiscrepancy,
      },
      {
        onSuccess: () => {
          clearSessionDraft(id)
          setIsDiscrepancyDialogOpen(false)
          navigate(`/summary/${id}`)
        },
        onError: (err) => setCompleteError(err.message),
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
    deleteSession.mutate(undefined, {
      onSuccess: () => {
        clearSessionDraft(id)
        setIsDeleteOpen(false)
        navigate(`/table/${session.table}`, { replace: true })
      },
    })
  }

  return (
    <div className={cn("page-stack", showStickyBar ? "pb-flow" : "pb-safe")}>
      <PageHeader
        backTo={`/table/${session.table}`}
        title={isCashingOut ? "Cash Out" : canEdit ? "Active Session" : "Session"}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <SessionDateEdit
              sessionId={session.id}
              tableId={session.table}
              date={session.date}
              readOnly={!canEdit}
            />
            <span className="text-border">·</span>
            <span>{session.players.length} players</span>
            {!canEdit && <Badge variant="outline">Viewer</Badge>}
          </span>
        }
      />

      {!isCashingOut ? (
        <div ref={playerListRef} className="space-y-5">
          {session.players.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex min-w-0 items-center gap-3 font-medium">
                  <div className="icon-well shrink-0 text-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{p.name}</span>
                </div>
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  {formatMoney(p.total_buy_in, currency)}
                </Badge>
              </CardHeader>
              {canEdit && (
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
              )}
            </Card>
          ))}

          {canEdit && !session.is_completed && (
            <Button variant="outline" className="h-12 w-full rounded-xl border-dashed" onClick={() => setIsAddPlayerOpen(true)}>
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
            const val = toAmount(cashOutValues[p.id])
            const net = val - toAmount(p.total_buy_in)
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                  <span className="min-w-0 truncate font-medium">{p.name}</span>
                  <Badge variant="outline" className="shrink-0">In: {formatMoney(p.total_buy_in, currency)}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label className="text-caption">Cash out</Label>
                  <MoneyInput
                    currencySymbol={currencySymbol}
                    placeholder="Cash out amount"
                    value={cashOutValues[p.id] || ""}
                    onChange={(e) => setCashOutValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    inputClassName="font-medium"
                    aria-label={`Cash out for ${p.name}`}
                  />
                  {cashOutValues[p.id] !== "" && (
                    <p className={`text-right text-sm font-medium ${profitLossClass(net)}`}>
                      Net: {net > 0 ? "+" : ""}{formatMoney(net, currency)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showStickyBar && (
        <StickyActionBar>
          {completeError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              {completeError}
            </p>
          )}
          {!isCashingOut ? (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsDeleteOpen(true)} aria-label="Delete session">
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

      {canEdit && (
        <>
          <ConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            title="Delete this session?"
            description="This cannot be undone. Buy-ins and players for this session will be removed."
            confirmLabel="Delete session"
            destructive
            pending={deleteSession.isPending}
            onConfirm={handleDeleteSession}
          />

          <DiscrepancyDialog
            open={isDiscrepancyDialogOpen}
            onOpenChange={setIsDiscrepancyDialogOpen}
            title="Session doesn't balance"
            description={
              <>
                Buy-ins and cash-outs don&apos;t match. Are you sure you want to close this session with{" "}
                <span className="font-semibold text-destructive">{formatMoney(discrepancyAmount, currency)}</span> in discrepancy?
              </>
            }
            confirmLabel="Close session anyway"
            pendingLabel="Closing…"
            isPending={completeSession.isPending}
            onConfirm={() => handleEndSession(true)}
            currency={currency}
            totals={{
              buyInLabel: "In play",
              cashOutLabel: "Cashed out",
              buyIn: totalBuyIn,
              cashOut: totalCashOut,
            }}
          />

          <ResponsiveDialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
            <ResponsiveDialogContent className="sm:max-w-sm border-border/50 bg-card/80 backdrop-blur-xl">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Add Player</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>Add a late-arriving player to this session.</ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <div className="space-y-3 py-2">
                <Label>Player Name</Label>
                <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
                  placeholder="Their name" className="h-11 bg-background/50"
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
        </>
      )}
    </div>
  )
}
