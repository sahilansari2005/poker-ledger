import { useNavigate } from "react-router-dom"
import { useReducedMotion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import BlurText from "@/components/reactbits/BlurText"
import { cn } from "@/lib/utils"

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
  const titleIsString = typeof title === "string"

  const handleBack = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className={cn("mb-8 border-b border-border/40 pb-6", className)}>
      <div className="flex items-start gap-4">
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
        <div className="min-w-0 flex-1 space-y-1.5">
          {titleIsString && !reduce ? (
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
            <h1 className="text-title">{title}</h1>
          )}
          {subtitle && (
            <div className="relative text-sm font-medium leading-relaxed text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
