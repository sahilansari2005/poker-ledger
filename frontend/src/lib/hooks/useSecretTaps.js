import { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_TAPS = 7
const DEFAULT_RESET_MS = 1500

/** Android-style multi-tap unlock. Resets if taps pause too long. */
export function useSecretTaps({ taps = DEFAULT_TAPS, resetMs = DEFAULT_RESET_MS, onUnlock } = {}) {
  const [count, setCount] = useState(0)
  const timerRef = useRef(null)
  const onUnlockRef = useRef(onUnlock)
  onUnlockRef.current = onUnlock

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const tap = useCallback(() => {
    clearTimeout(timerRef.current)
    setCount((prev) => {
      const next = prev + 1
      if (next >= taps) {
        onUnlockRef.current?.()
        return 0
      }
      timerRef.current = setTimeout(() => setCount(0), resetMs)
      return next
    })
  }, [taps, resetMs])

  return { tap, count }
}
