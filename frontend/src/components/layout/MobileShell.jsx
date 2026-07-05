import { useLocation } from "react-router-dom"
import BottomNav from "./BottomNav"
import PageTransition from "./PageTransition"
import { cn } from "@/lib/utils"

export default function MobileShell({ children }) {
  const { pathname } = useLocation()
  const hideNav = /^\/(table|session|summary)\//.test(pathname)

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div
        className={cn(
          "mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-5xl px-4 pt-safe",
          hideNav ? "pb-safe" : "pb-nav"
        )}
      >
        <PageTransition>{children}</PageTransition>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
