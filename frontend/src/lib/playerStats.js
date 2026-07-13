import { toAmount } from "@/lib/sessionBalance"

export function computePlayerStats(members, sessions, transfers) {
  const stats = members.reduce((acc, member) => {
    acc[member.name] = { totalInvested: 0, totalProfit: 0 }
    sessions
      .filter((session) => session.is_completed)
      .forEach((session) => {
        const player = session.players.find((entry) => entry.name === member.name)
        if (!player) return
        acc[member.name].totalInvested += toAmount(player.total_buy_in)
        if (player.cash_out !== null) {
          acc[member.name].totalProfit += toAmount(player.cash_out) - toAmount(player.total_buy_in)
        }
      })
    return acc
  }, {})

  for (const transfer of transfers || []) {
    const amount = toAmount(transfer.amount)
    if (stats[transfer.from_player]) {
      stats[transfer.from_player].totalProfit -= amount
    }
    if (stats[transfer.to_player]) {
      stats[transfer.to_player].totalProfit += amount
    }
  }

  return stats
}
