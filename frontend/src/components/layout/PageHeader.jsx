import { useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  const handleBack = () => {
    if (onBack) onBack()
    else if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className={cn("mb-6 border-b border-border/40 pb-4", className)}>
      <div className="flex items-start gap-3">
        {(backTo || onBack) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 size-11 shrink-0 rounded-full bg-background/80 shadow-sm touch-manipulation"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
