import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuroraBackdrop from "@/components/reactbits/AuroraBackdrop"
import ShinyText from "@/components/reactbits/ShinyText"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import { getConfig, getSession, isAuthenticatedSession, login, parseAllauthErrors, signup } from "@/lib/allauth"
import { queryClient } from "@/lib/queryClient"
import { queryKeys } from "@/lib/queries"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  // Post-auth destination (e.g. back to a /shared/<token> page). Only allow
  // in-app paths to avoid open redirects. Default to tables on the revamp routes.
  const rawNext = new URLSearchParams(location.search).get("next")
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/tables"
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
          queryClient.setQueryData(queryKeys.authSession, session)
          navigate(next, { replace: true })
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
  }, [navigate, next])

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
        queryClient.setQueryData(queryKeys.authSession, response)
        navigate(next, { replace: true })
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

  const isLogin = mode === "login"
  const eyebrow = isLogin ? "Welcome back" : "Join the table"
  const description = isLogin
    ? "Sign in to access your tables and preferences."
    : "Create an account to start tracking sessions."

  return (
    <div className="dark relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <AuroraBackdrop reduce={reduce} />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-10">
        <motion.div
          className="space-y-3 text-center"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/"
            className="inline-block text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            <span className="text-primary">♠</span> Poker Ledger
          </Link>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              <ShinyText
                disabled={reduce}
                text={eyebrow}
                speed={3.5}
                className="text-xs font-medium uppercase tracking-[0.16em]"
                color="#8fa3c8"
                shineColor="#eef3ff"
              />
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{description}</p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <SpotlightCard className="bg-card/70 p-5 backdrop-blur-md sm:p-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
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
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="bg-background/50"
                  />
                </div>
                {!isLogin && (
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
                      className="bg-background/50"
                    />
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full rounded-xl" size="lg" type="submit" disabled={submitting}>
                  {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {isLogin ? "No account yet?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={toggleMode}
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/" className="text-primary underline-offset-4 hover:underline">
                    Back to home
                  </Link>
                </p>
              </form>
            )}
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  )
}
