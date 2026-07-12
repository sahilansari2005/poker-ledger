import { useEffect, useRef } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { isAuthenticatedSession } from "@/lib/allauth"
import { queryClient } from "@/lib/queryClient"
import { queryKeys, useAuthSession } from "@/lib/queries"

export default function AllauthAuthGate() {
  const location = useLocation()
  const { data: session, isPending, isError } = useAuthSession()
  const warmedQueries = useRef(false)

  const authenticated = !isError && isAuthenticatedSession(session)

  useEffect(() => {
    if (!authenticated || warmedQueries.current) return
    warmedQueries.current = true
    // Heal preferences/tables if they 401'd on public routes before login.
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
    queryClient.invalidateQueries({ queryKey: queryKeys.tables })
  }, [authenticated])

  if (isPending) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
