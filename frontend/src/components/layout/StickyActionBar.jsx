import { cn } from "@/lib/utils"

export default function StickyActionBar({ children, className }) {
  return (
    <div
      className={cn(
        "sticky-action-bar fixed inset-x-0 bottom-0 z-40 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 md:max-w-2xl lg:max-w-3xl">
        {children}
      </div>
    </div>
  )
}
