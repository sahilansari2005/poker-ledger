import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import { QueryClientProvider } from "@tanstack/react-query"
import { registerSW } from "virtual:pwa-register"
import App from "./App"
import ClerkAuthGate from "./components/auth/ClerkAuthGate"
import DevAuthGate from "./components/auth/DevAuthGate"
import { queryClient } from "./lib/queryClient"
import "./index.css"

registerSW({ immediate: true })

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const allowDevAuth = import.meta.env.VITE_ALLOW_DEV_AUTH === "true"

function MissingClerkConfig() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold">Clerk is not configured</h1>
        <p className="text-sm text-muted-foreground">
          Set <code className="text-foreground">VITE_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-foreground">CLERK_ISSUER</code> in your environment to sign in.
        </p>
      </div>
    </div>
  )
}

function Root() {
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <QueryClientProvider client={queryClient}>
          <ClerkAuthGate>
            <App />
          </ClerkAuthGate>
        </QueryClientProvider>
      </ClerkProvider>
    )
  }

  if (import.meta.env.DEV || allowDevAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <DevAuthGate>
          <App />
        </DevAuthGate>
      </QueryClientProvider>
    )
  }

  return <MissingClerkConfig />
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
