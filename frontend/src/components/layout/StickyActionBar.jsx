import { cn } from "@/lib/utils"

export default function StickyActionBar({ children, className }) {
  return (
    <div
      className={cn(
        "sticky-action-bar fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 p-4 backdrop-blur-lg pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2 md:max-w-3xl lg:max-w-5xl">
        {children}
      </div>
    </div>
  )
}
