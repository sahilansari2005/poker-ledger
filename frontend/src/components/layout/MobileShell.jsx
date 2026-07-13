import { Outlet, useLocation } from "react-router-dom"
import { useReducedMotion } from "framer-motion"
import BottomNav from "./BottomNav"
import PageTransition from "./PageTransition"
import AuroraBackdrop from "@/components/reactbits/AuroraBackdrop"
import { cn } from "@/lib/utils"

export default function MobileShell() {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const hideNav = /^\/(table|session|summary)\//.test(pathname)

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <AuroraBackdrop
        reduce={reduce}
        amplitude={0.55}
        blend={0.35}
        speed={0.4}
        className="pointer-events-none absolute inset-x-0 top-0 h-[32%]"
      />
      {/* Soft wash so header captions stay readable over the aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-40 bg-gradient-to-b from-background via-background/80 to-transparent"
      />
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-lg px-5 pt-safe ui-scroll-surface md:max-w-2xl lg:max-w-3xl",
          // Hide-nav routes own their bottom padding (sticky bars / page safe-area).
          hideNav ? "pb-0" : "pb-nav"
        )}
      >
        <div className="py-6 md:py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
