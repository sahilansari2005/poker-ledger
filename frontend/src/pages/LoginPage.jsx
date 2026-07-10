import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getConfig, getSession, isAuthenticatedSession, login, parseAllauthErrors, signup } from "@/lib/allauth"

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await getConfig()
        const session = await getSession()
        if (!cancelled && isAuthenticatedSession(session)) {
          navigate("/tables", { replace: true })
        }
      } catch {
        // CSRF priming failed; form submit may still work after retry.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      const response =
        mode === "login"
          ? await login(email.trim(), password)
          : await signup(email.trim(), password)

      if (response.ok && isAuthenticatedSession(response)) {
        navigate("/tables", { replace: true })
        return
      }

      setError(parseAllauthErrors(response))
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"))
    setError("")
    setConfirmPassword("")
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-title">Poker Ledger</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to access your tables and preferences."
              : "Create an account to start tracking sessions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-caption">Loading…</p>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" size="lg" type="submit" disabled={submitting}>
                {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </Button>
              <p className="text-center text-caption">
                {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={toggleMode}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
              <p className="text-center text-caption">
                <Link to="/" className="text-primary underline-offset-4 hover:underline">
                  Back to home
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
