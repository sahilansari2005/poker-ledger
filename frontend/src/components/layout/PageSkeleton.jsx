/** Lightweight placeholder while a detail page loads. */
export default function PageSkeleton() {
  return (
    <div className="page-stack animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-3 border-b border-border/40 pb-6">
        <div className="h-8 w-2/3 max-w-xs rounded-lg bg-muted" />
        <div className="h-4 w-1/3 max-w-[8rem] rounded-lg bg-muted/70" />
      </div>
      <div className="h-28 rounded-xl bg-muted/60" />
      <div className="h-36 rounded-xl bg-muted/50" />
      <div className="h-36 rounded-xl bg-muted/50" />
    </div>
  )
}
