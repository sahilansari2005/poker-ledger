import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSession } from "@/lib/allauth"
import { logout } from "@/lib/allauth"

export default function AccountCard() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)

  useEffect(() => {
    getSession()
      .then((response) => {
        const user = response.data?.data?.user
        if (!user) return
        setSession({
          name: user.display || user.username,
          email: user.email,
        })
      })
      .catch(() => setSession(null))
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
    } finally {
      navigate("/login", { replace: true })
    }
  }

  return (
    <Card className="ui-card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Account</CardTitle>
        <CardDescription>Your signed-in account.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {session?.name || session?.email || "Signed in"}
          </p>
          {session?.email && session?.name && (
            <p className="truncate text-xs text-muted-foreground">{session.email}</p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
