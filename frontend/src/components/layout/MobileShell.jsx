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
    <div className="dark relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <AuroraBackdrop
        reduce={reduce}
        amplitude={0.75}
        blend={0.5}
        speed={0.45}
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%]"
      />
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-lg px-5 pt-safe ui-scroll-surface md:max-w-2xl lg:max-w-3xl",
          hideNav ? "pb-safe" : "pb-nav"
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
