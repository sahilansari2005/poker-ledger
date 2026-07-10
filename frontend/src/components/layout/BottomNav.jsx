import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calculator, Trophy, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { to: "/tables", label: "Tables", icon: LayoutGrid, end: true },
  { to: "/calculator", label: "Chips", icon: Calculator },
  { to: "/learn", label: "Hands", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
]

function isLinkActive(pathname, { to, end }) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    links.findIndex(link => isLinkActive(pathname, link))
  )

  return (
    <nav className="dock-shell" aria-label="Main navigation">
      <div className="dock-glass mx-auto flex max-w-md items-stretch justify-between gap-1 p-1.5">
        <div
          className="dock-indicator"
          style={{
            "--dock-tabs": links.length,
            "--dock-active": activeIndex,
          }}
          aria-hidden
        />
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative z-[2] flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-sm font-medium transition-colors duration-200 touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-[0.98]"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-5 transition-all duration-200",
                    isActive && "stroke-[2.25]"
                  )}
                  aria-hidden
                />
                <span className="leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
