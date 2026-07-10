import { Outlet, useLocation } from "react-router-dom"
import BottomNav from "./BottomNav"
import PageTransition from "./PageTransition"
import { cn } from "@/lib/utils"

export default function MobileShell() {
  const { pathname } = useLocation()
  const hideNav = /^\/(table|session|summary)\//.test(pathname)

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div
        className={cn(
          "mx-auto w-full max-w-lg px-5 pt-safe ui-scroll-surface md:max-w-2xl lg:max-w-3xl",
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
