import { useAutoAnimate } from "@formkit/auto-animate/react"

export function useAnimatedList(options = {}) {
  return useAutoAnimate({
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    ...options,
  })
}
