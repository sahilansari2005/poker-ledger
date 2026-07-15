import { useNavigate } from "react-router-dom"
import { useReducedMotion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import BlurText from "@/components/reactbits/BlurText"
import { cn } from "@/lib/utils"
import { useSyncExternalStore } from "react"

function subscribeCoarsePointer(onStoreChange) {
  const mq = window.matchMedia("(pointer: coarse)")
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches
}

function getServerCoarsePointer() {
  return false
}

export default function PageHeader({
  title,
  subtitle,
  backTo,
  onBack,
  action,
  className,
}) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointer,
    getServerCoarsePointer
  )
  const titleIsString = typeof title === "string"
  // Blur/filter text animation overlaps and smears on iOS Safari; use a plain title there.
  const animateTitle = titleIsString && !reduce && !coarsePointer

  const handleBack = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className={cn("mb-8 border-b border-border/40 pb-6", className)}>
      <div className="flex items-start gap-3 sm:gap-4">
        {(backTo || onBack) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0 touch-manipulation"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1 space-y-1.5 overflow-hidden">
          {animateTitle ? (
            <>
              <h1 className="sr-only">{title}</h1>
              <BlurText
                aria-hidden="true"
                text={title}
                delay={45}
                stepDuration={0.28}
                className="text-title"
              />
            </>
          ) : (
            <h1 className="text-title wrap-break-word">{title}</h1>
          )}
          {subtitle && (
            <div className="relative wrap-break-word text-sm font-medium leading-relaxed text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
