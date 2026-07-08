import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { getSession, isAuthenticatedSession } from "@/lib/allauth"
import { queryClient } from "@/lib/queryClient"
import { queryKeys } from "@/lib/queries"

export default function AllauthAuthGate() {
  const location = useLocation()
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let cancelled = false

    getSession()
      .then((session) => {
        if (cancelled) return
        setStatus(isAuthenticatedSession(session) ? "ready" : "signed-out")
      })
      .catch(() => {
        if (!cancelled) setStatus("signed-out")
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    if (status !== "ready") return
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
    queryClient.invalidateQueries({ queryKey: queryKeys.tables })
  }, [status])

  if (status === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (status === "signed-out") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
