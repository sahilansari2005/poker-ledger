import { useReducedMotion } from "framer-motion"
import AuroraBackdrop from "@/components/reactbits/AuroraBackdrop"
import SectionPill from "@/components/reactbits/SectionPill"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import { cn } from "@/lib/utils"

/** Full-viewport loading state matching the app shell + aurora chrome. */
export default function AppLoadingScreen({ label = "Loading", className }) {
  const reduce = useReducedMotion()

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground",
        className
      )}
      aria-busy="true"
      aria-label={label}
    >
      <AuroraBackdrop
        reduce={reduce}
        amplitude={0.75}
        blend={0.5}
        speed={0.45}
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-5 py-10">
        <p className="text-2xl font-semibold tracking-tight">
          <span className="text-primary">♠</span> Poker Ledger
        </p>
        <SectionPill text={label} />
        <SpotlightCard className="w-full space-y-4 border-border/50 bg-card/70 p-5 backdrop-blur-md">
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-1/3 rounded-full bg-muted" />
            <div className="h-10 rounded-xl bg-muted/70" />
            <div className="h-10 rounded-xl bg-muted/50" />
          </div>
        </SpotlightCard>
      </div>
    </div>
  )
}
