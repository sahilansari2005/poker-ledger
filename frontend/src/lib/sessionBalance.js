/** Buy-ins and cash-outs are balanced when they match within this tolerance. */
export const BALANCE_TOLERANCE = 0.01

export function toAmount(value) {
  const amount = typeof value === "number" ? value : parseFloat(value)
  return Number.isFinite(amount) ? amount : 0
}

export function playerNet(player) {
  return toAmount(player.cash_out) - toAmount(player.total_buy_in)
}

export function computeTotals(players, getBuyIn, getCashOut) {
  return players.reduce(
    (acc, player) => {
      acc.buyIn += toAmount(getBuyIn(player))
      acc.cashOut += toAmount(getCashOut(player))
      return acc
    },
    { buyIn: 0, cashOut: 0 },
  )
}

export function balanceFromTotals(buyIn, cashOut) {
  const remaining = buyIn - cashOut
  return {
    remaining,
    isBalanced: Math.abs(remaining) < BALANCE_TOLERANCE,
    discrepancyAmount: Math.abs(remaining),
  }
}

export function computeBalance(players, getBuyIn, getCashOut) {
  const totals = computeTotals(players, getBuyIn, getCashOut)
  return { ...totals, ...balanceFromTotals(totals.buyIn, totals.cashOut) }
}

export function sortPlayersByProfit(players) {
  return [...players].sort((a, b) => playerNet(b) - playerNet(a))
}

export function draftFromPlayers(players) {
  const draft = {}
  for (const player of players || []) {
    draft[player.id] = {
      buyIn: player.total_buy_in != null ? String(player.total_buy_in) : "",
      cashOut: player.cash_out != null ? String(player.cash_out) : "",
    }
  }
  return draft
}

export function buildAdjustPayload(players, draft) {
  return players.map((player) => ({
    player_id: player.id,
    total_buy_in: toAmount(draft[player.id]?.buyIn),
    cash_out: toAmount(draft[player.id]?.cashOut),
  }))
}

export function buildCashOutPayload(players, cashOutValues) {
  return players.map((player) => ({
    player_id: player.id,
    cash_out: toAmount(cashOutValues[player.id]),
  }))
}

export function validateAdjustDraft(players, draft) {
  for (const player of players) {
    const buyIn = draft[player.id]?.buyIn
    const cashOut = draft[player.id]?.cashOut
    if (buyIn === "" || cashOut === "" || Number.isNaN(parseFloat(buyIn)) || Number.isNaN(parseFloat(cashOut))) {
      return "Enter a buy-in and cash-out for every player."
    }
    if (parseFloat(buyIn) < 0 || parseFloat(cashOut) < 0) {
      return "Amounts cannot be negative."
    }
  }
  return null
}
