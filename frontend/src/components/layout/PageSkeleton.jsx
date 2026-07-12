import SpotlightCard from "@/components/reactbits/SpotlightCard"
import { cn } from "@/lib/utils"

/** In-shell page placeholder matching PageHeader + SpotlightCard layout. */
export default function PageSkeleton({ className }) {
  return (
    <div
      className={cn("page-stack pb-safe", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="mb-8 animate-pulse border-b border-border/40 pb-6">
        <div className="space-y-3">
          <div className="h-8 w-2/3 max-w-xs rounded-lg bg-card" />
          <div className="h-4 w-1/3 max-w-[9rem] rounded-lg bg-muted/70" />
        </div>
      </header>

      <SpotlightCard className="animate-pulse space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-md bg-muted" />
            <div className="h-3 w-44 rounded-md bg-muted/60" />
          </div>
          <div className="h-7 w-16 rounded-full bg-muted/50" />
        </div>
        <div className="h-11 rounded-xl bg-muted/70" />
        <div className="h-11 rounded-xl bg-muted/50" />
      </SpotlightCard>

      <SpotlightCard className="animate-pulse space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-3 w-40 rounded-md bg-muted/60" />
        </div>
        <div className="h-28 rounded-xl bg-muted/40" />
      </SpotlightCard>

      <SpotlightCard className="animate-pulse space-y-4 p-5">
        <div className="h-4 w-32 rounded-md bg-muted" />
        <div className="h-11 rounded-xl bg-muted/60" />
      </SpotlightCard>
    </div>
  )
}
