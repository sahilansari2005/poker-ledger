import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"

export function useAnimatedList(options = {}) {
  const isMobile = useIsMobile()

  return useAutoAnimate({
    duration: isMobile ? 0 : 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    ...options,
  })
}
