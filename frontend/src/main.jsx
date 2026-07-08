import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import App from "./App"
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext"
import { queryClient } from "./lib/queryClient"
import "./index.css"

if (import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <App />
      </UserPreferencesProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
