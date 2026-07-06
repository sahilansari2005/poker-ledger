import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  clearSessionDraft,
  getSessionDraft,
  mergeCashOutDraft,
  setSessionDraft,
} from "@/lib/sessionDraft"

describe("sessionDraft", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it("persists and restores draft state for a session", () => {
    setSessionDraft("42", {
      isCashingOut: true,
      addValues: { 1: "10" },
      cashOutValues: { 1: "25", 2: "30" },
    })

    expect(getSessionDraft("42")).toEqual({
      isCashingOut: true,
      addValues: { 1: "10" },
      cashOutValues: { 1: "25", 2: "30" },
    })
  })

  it("clears draft when session completes", () => {
    setSessionDraft("42", { isCashingOut: true, addValues: {}, cashOutValues: {} })
    clearSessionDraft("42")
    expect(getSessionDraft("42")).toBeNull()
  })

  it("mergeCashOutDraft keeps existing entries when returning to cash out", () => {
    const players = [
      { id: 1, cash_out: null },
      { id: 2, cash_out: null },
    ]

    const merged = mergeCashOutDraft({ 1: "19", 2: "30" }, players)
    expect(merged).toEqual({ 1: "19", 2: "30" })

    const again = mergeCashOutDraft(merged, players)
    expect(again).toEqual({ 1: "19", 2: "30" })
  })

  it("mergeCashOutDraft adds empty slots for new players only", () => {
    const merged = mergeCashOutDraft({ 1: "19" }, [
      { id: 1, cash_out: null },
      { id: 3, cash_out: "5" },
    ])

    expect(merged).toEqual({ 1: "19", 3: "5" })
  })
})
