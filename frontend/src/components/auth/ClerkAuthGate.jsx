import { useEffect } from "react"
import { useAuth, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react"
import { setAuthTokenGetter } from "@/lib/api"

export default function ClerkAuthGate({ children }) {
  const { getToken, isLoaded } = useAuth()

  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getToken()
      } catch {
        return null
      }
    })
  }, [getToken])

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
