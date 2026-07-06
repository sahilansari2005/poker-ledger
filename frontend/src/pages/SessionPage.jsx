import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
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
import PageHeader from "@/components/layout/PageHeader"
import StickyActionBar from "@/components/layout/StickyActionBar"

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
        <h2 className="text-xl font-bold mb-2">Session not found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Go back home</Button>
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

  const handleEndSession = () => {
    const cashOuts = session.players.map(p => ({
      player_id: p.id,
      cash_out: parseFloat(cashOutValues[p.id]) || 0,
    }))

    completeSession.mutate(cashOuts, {
      onSuccess: () => {
        clearSessionDraft(id)
        navigate(`/summary/${id}`)
      },
      onError: (err) => alert(err.message),
    })
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

  const totalBuyIn = session.players.reduce((sum, p) => sum + parseFloat(p.total_buy_in), 0)
  const totalCashOut = session.players.reduce((sum, p) => sum + (parseFloat(cashOutValues[p.id]) || 0), 0)
  const isBalanced = Math.abs(totalBuyIn - totalCashOut) < 0.01
  const remainingToDistribute = totalBuyIn - totalCashOut

  return (
    <div className="space-y-5 pb-32">
      <PageHeader
        backTo={`/table/${session.table}`}
        title={isCashingOut ? "Cash Out" : "Active Session"}
        subtitle={`${session.date} · ${session.players.length} players`}
      />

      {!isCashingOut ? (
        <div ref={playerListRef} className="space-y-4">
          {session.players.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3 font-bold">
                  <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{p.name}</span>
                </div>
                <motion.div
                  key={p.total_buy_in}
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Badge variant="outline">{formatMoney(p.total_buy_in, currency)}</Badge>
                </motion.div>
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
            <Button variant="outline" className="h-12 w-full rounded-xl border-dashed" onClick={() => setIsAddPlayerOpen(true)}>
              <UserPlus className="mr-2 size-4" /> Add Player
            </Button>
          )}
        </div>
      ) : (
        <div ref={playerListRef} className="space-y-4">
          <Card className={isBalanced ? "border-primary/40 bg-primary/5" : "border-destructive/30"}>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">In play</p>
                  <p className="text-2xl font-bold">{formatMoney(totalBuyIn, currency)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Cashed out</p>
                  <p className="text-2xl font-bold">{formatMoney(totalCashOut, currency)}</p>
                </div>
              </div>
              {!isBalanced && (
                <p className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {formatMoney(remainingToDistribute, currency)} remaining
                </p>
              )}
            </CardContent>
          </Card>

          {session.players.map((p) => {
            const val = parseFloat(cashOutValues[p.id]) || 0
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-bold">{p.name}</span>
                  <Badge variant="outline" className="text-xs">In: {formatMoney(p.total_buy_in, currency)}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Cash out</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Cash out amount"
                        value={cashOutValues[p.id] || ""}
                        onChange={(e) => setCashOutValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="pl-8 text-lg font-semibold"
                      />
                    </div>
                    {cashOutValues[p.id] !== "" && (
                      <p className={`text-right text-xs font-semibold ${val - parseFloat(p.total_buy_in) > 0 ? "text-emerald-600" : val - parseFloat(p.total_buy_in) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
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
              <Button variant="outline" className="h-12 shrink-0" onClick={handleDeleteSession} aria-label="Delete session">
                <Trash2 className="size-4" />
              </Button>
              <Button size="lg" className="h-12 flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleStartCashOut}>
                <ShieldCheck className="mr-2 size-4" />
                Cash Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setIsCashingOut(false)}>
                Back to buy-ins
              </Button>
              <Button
                size="lg"
                className="h-12 flex-1 rounded-xl"
                onClick={handleEndSession}
                disabled={!isBalanced || completeSession.isPending}
              >
                <ShieldCheck className="mr-2 size-4" />
                Complete
              </Button>
            </div>
          )}
        </StickyActionBar>
      )}

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
    </div>
  )
}
