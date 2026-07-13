import { describe, expect, it } from "vitest"
import {
  balanceFromTotals,
  buildAdjustPayload,
  buildCashOutPayload,
  computeBalance,
  draftFromPlayers,
  playerNet,
  sortPlayersByProfit,
  toAmount,
  validateAdjustDraft,
} from "@/lib/sessionBalance"

describe("sessionBalance", () => {
  it("treats near-equal totals as balanced", () => {
    expect(balanceFromTotals(100, 100).isBalanced).toBe(true)
    expect(balanceFromTotals(100, 100.005).isBalanced).toBe(true)
    expect(balanceFromTotals(100, 99).isBalanced).toBe(false)
  })

  it("computes cash-out balance from player values", () => {
    const players = [
      { id: 1, total_buy_in: "40" },
      { id: 2, total_buy_in: "60" },
    ]
    const cashOutValues = { 1: "50", 2: "50" }
    const balance = computeBalance(
      players,
      (player) => player.total_buy_in,
      (player) => cashOutValues[player.id],
    )
    expect(balance.buyIn).toBe(100)
    expect(balance.cashOut).toBe(100)
    expect(balance.isBalanced).toBe(true)
  })

  it("builds payloads and drafts", () => {
    const players = [
      { id: 1, total_buy_in: "20.00", cash_out: "30.00" },
      { id: 2, total_buy_in: "10", cash_out: null },
    ]
    expect(draftFromPlayers(players)).toEqual({
      1: { buyIn: "20.00", cashOut: "30.00" },
      2: { buyIn: "10", cashOut: "" },
    })
    expect(buildCashOutPayload(players, { 1: "25", 2: "" })).toEqual([
      { player_id: 1, cash_out: 25 },
      { player_id: 2, cash_out: 0 },
    ])
    expect(buildAdjustPayload(players, {
      1: { buyIn: "20", cashOut: "30" },
      2: { buyIn: "10", cashOut: "0" },
    })).toEqual([
      { player_id: 1, total_buy_in: 20, cash_out: 30 },
      { player_id: 2, total_buy_in: 10, cash_out: 0 },
    ])
  })

  it("validates adjust drafts and sorts by profit", () => {
    const players = [
      { id: 1, total_buy_in: "20", cash_out: "50" },
      { id: 2, total_buy_in: "20", cash_out: "10" },
    ]
    expect(validateAdjustDraft(players, {
      1: { buyIn: "", cashOut: "1" },
      2: { buyIn: "1", cashOut: "1" },
    })).toMatch(/buy-in and cash-out/i)
    expect(validateAdjustDraft(players, {
      1: { buyIn: "-1", cashOut: "1" },
      2: { buyIn: "1", cashOut: "1" },
    })).toMatch(/negative/i)
    expect(sortPlayersByProfit(players).map((p) => p.id)).toEqual([1, 2])
    expect(playerNet(players[0])).toBe(30)
    expect(toAmount("12.5")).toBe(12.5)
  })
})
