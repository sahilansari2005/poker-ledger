import { useReducedMotion } from "framer-motion"
import ShinyText from "@/components/reactbits/ShinyText"
import { useResolvedTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

/** Small shiny eyebrow pill for section labels across the app. */
export default function SectionPill({ text, className = "" }) {
  const reduce = useReducedMotion()
  const resolvedTheme = useResolvedTheme()
  const isLight = resolvedTheme === "light"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 backdrop-blur-sm",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      <ShinyText
        disabled={reduce}
        text={text}
        speed={3.5}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
        color={isLight ? "#3d4f73" : "#b7c4de"}
        shineColor={isLight ? "#1a2744" : "#f4f7ff"}
      />
    </span>
  )
}
