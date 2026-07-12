import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import { logout } from "@/lib/allauth"
import { queryClient } from "@/lib/queryClient"
import { queryKeys, useAuthSession } from "@/lib/queries"

function accountFromSession(sessionResponse) {
  const user = sessionResponse?.data?.data?.user
  if (!user) return null
  return {
    name: user.display || user.username,
    email: user.email,
  }
}

export default function AccountCard() {
  const navigate = useNavigate()
  const { data: sessionResponse } = useAuthSession()
  const session = accountFromSession(sessionResponse)

  const handleSignOut = async () => {
    try {
      await logout()
    } finally {
      queryClient.removeQueries({ queryKey: queryKeys.authSession })
      queryClient.clear()
      navigate("/login", { replace: true })
    }
  }

  return (
    <SpotlightCard className="ui-card-hover space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">Your signed-in account.</p>
        </div>
        <SectionPill text="Signed in" />
      </div>
      <div className="flex items-center justify-between gap-4">
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
      </div>
    </SpotlightCard>
  )
}
