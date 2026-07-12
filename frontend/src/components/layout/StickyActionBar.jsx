import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

/** Viewport-fixed action chrome. Portaled to body so page transforms cannot trap it. */
export default function StickyActionBar({ children, className }) {
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className={cn(
        "sticky-action-bar fixed inset-x-0 bottom-0 z-40 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 md:max-w-2xl lg:max-w-3xl">
        {children}
      </div>
    </div>,
    document.body
  )
}
