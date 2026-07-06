import { useEffect } from "react"
import { setAuthTokenGetter } from "@/lib/api"

const DEV_USER_ID = "dev-user"

export default function DevAuthGate({ children }) {
  useEffect(() => {
    setAuthTokenGetter(async () => DEV_USER_ID)
  }, [])

  return children
}
