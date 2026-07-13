import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import App from "./App"
import { ThemeProvider } from "./contexts/ThemeContext"
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
      <ThemeProvider>
        <UserPreferencesProvider>
          <App />
        </UserPreferencesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
