import { AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function NotFoundState({
  title,
  description,
  actionLabel = "Go back home",
  to = "/tables",
  icon: Icon = AlertCircle,
}) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center pb-safe text-muted-foreground">
      <Card className="flex flex-col items-center border-border/50 bg-card/50 p-8 backdrop-blur-md">
        <Icon className="mb-4 size-12 opacity-50" />
        <h2 className="text-section mb-2">{title}</h2>
        {description ? <p className="mb-4 max-w-xs text-center text-caption">{description}</p> : null}
        <Button variant="outline" onClick={() => navigate(to)}>
          {actionLabel}
        </Button>
      </Card>
    </div>
  )
}
