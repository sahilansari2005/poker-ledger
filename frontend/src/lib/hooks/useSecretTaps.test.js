import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useSecretTaps } from "@/lib/hooks/useSecretTaps"

describe("useSecretTaps", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("unlocks after the configured number of taps", () => {
    const onUnlock = vi.fn()
    const { result } = renderHook(() => useSecretTaps({ taps: 7, onUnlock }))

    for (let i = 0; i < 6; i += 1) {
      act(() => result.current.tap())
    }
    expect(onUnlock).not.toHaveBeenCalled()
    expect(result.current.count).toBe(6)

    act(() => result.current.tap())
    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(result.current.count).toBe(0)
  })

  it("resets the count after a pause", () => {
    const onUnlock = vi.fn()
    const { result } = renderHook(() =>
      useSecretTaps({ taps: 7, resetMs: 1500, onUnlock })
    )

    act(() => result.current.tap())
    act(() => result.current.tap())
    expect(result.current.count).toBe(2)

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current.count).toBe(0)

    act(() => result.current.tap())
    expect(result.current.count).toBe(1)
    expect(onUnlock).not.toHaveBeenCalled()
  })
})
