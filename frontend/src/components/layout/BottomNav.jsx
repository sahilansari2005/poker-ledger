import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calculator, Trophy, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "Tables", icon: LayoutGrid, end: true },
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
      <div className="dock-glass mx-auto flex max-w-md items-stretch justify-between gap-0.5 p-1.5">
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
                "relative z-[2] flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-300 touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-95"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-[1.35rem] transition-all duration-300 ease-out",
                    isActive && "scale-110 stroke-[2.5]"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "leading-none transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-80"
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
