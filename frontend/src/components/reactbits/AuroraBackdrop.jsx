import Aurora from "@/components/reactbits/Aurora"
import { useResolvedTheme } from "@/contexts/ThemeContext"

const DARK_STOPS = ["#3A29FF", "#7CA6F5", "#5227FF"]
const LIGHT_STOPS = ["#9BB8F0", "#C5D6F8", "#A99AF8"]

/** Masked aurora (or static radial fallback) for marketing/auth surfaces. */
export default function AuroraBackdrop({
  reduce = false,
  colorStops,
  amplitude = 1.0,
  blend = 0.55,
  speed = 0.6,
  className = "pointer-events-none absolute inset-x-0 top-0 h-[62%]",
}) {
  const resolvedTheme = useResolvedTheme()
  const isLight = resolvedTheme === "light"
  const stops = colorStops || (isLight ? LIGHT_STOPS : DARK_STOPS)
  const falloff = isLight
    ? "oklch(0.72 0.1 252 / 0.16)"
    : "oklch(0.48 0.2 252 / 0.28)"

  return (
    <div
      aria-hidden
      className={className}
      style={{
        opacity: isLight ? 0.55 : 0.7,
        maskImage: "linear-gradient(to bottom, black 40%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
      }}
    >
      {reduce ? (
        <div
          className="h-full w-full"
          style={{
            background: `radial-gradient(ellipse 75% 70% at 50% -10%, ${falloff}, transparent)`,
          }}
        />
      ) : (
        <Aurora
          colorStops={stops}
          amplitude={amplitude}
          blend={isLight ? Math.min(blend, 0.4) : blend}
          speed={speed}
        />
      )}
    </div>
  )
}
