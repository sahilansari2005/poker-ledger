import { describe, expect, it } from "vitest"
import { computePlayerAnalytics, computePlayerStats } from "@/lib/playerStats"

const members = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]

const sessions = [
  {
    id: 10,
    date: "2026-01-10",
    is_completed: true,
    players: [
      { name: "Alice", total_buy_in: "40", cash_out: "70" },
      { name: "Bob", total_buy_in: "40", cash_out: "10" },
    ],
  },
  {
    id: 11,
    date: "2026-02-01",
    is_completed: true,
    players: [
      { name: "Alice", total_buy_in: "20", cash_out: "5" },
      { name: "Bob", total_buy_in: "20", cash_out: "35" },
    ],
  },
  {
    id: 12,
    date: "2026-03-01",
    is_completed: false,
    players: [{ name: "Alice", total_buy_in: "50", cash_out: null }],
  },
]

const transfers = [{ from_player: "Alice", to_player: "Bob", amount: "10" }]

describe("computePlayerStats", () => {
  it("aggregates invested and profit including transfers", () => {
    const stats = computePlayerStats(members, sessions, transfers)
    expect(stats.Alice.totalInvested).toBe(60)
    expect(stats.Alice.totalProfit).toBe(5) // 30 - 15 - 10 transfer out
    expect(stats.Bob.totalProfit).toBe(-5) // -30 + 15 + 10 transfer in
  })
})

describe("computePlayerAnalytics", () => {
  it("returns session history and summary for one player", () => {
    const analytics = computePlayerAnalytics("Alice", sessions, transfers)

    expect(analytics.sessionsPlayed).toBe(2)
    expect(analytics.wins).toBe(1)
    expect(analytics.losses).toBe(1)
    expect(analytics.breakEven).toBe(0)
    expect(analytics.winRate).toBe(0.5)
    expect(analytics.totalInvested).toBe(60)
    expect(analytics.sessionProfit).toBe(15)
    expect(analytics.avgProfit).toBe(7.5)
    expect(analytics.avgBuyIn).toBe(30)
    expect(analytics.biggestWin).toBe(30)
    expect(analytics.biggestLoss).toBe(-15)
    expect(analytics.transferOut).toBe(10)
    expect(analytics.transferIn).toBe(0)
    expect(analytics.transferNet).toBe(-10)
    expect(analytics.totalProfit).toBe(5)
    expect(analytics.history.map((row) => row.sessionId)).toEqual([11, 10])
  })

  it("handles a player with no completed sessions", () => {
    const analytics = computePlayerAnalytics("Carol", sessions, [])
    expect(analytics.sessionsPlayed).toBe(0)
    expect(analytics.totalProfit).toBe(0)
    expect(analytics.history).toEqual([])
  })
})
