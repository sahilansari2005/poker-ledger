import { createContext, useContext, useState, useEffect } from "react"
import { authApi } from "@/lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => authApi.logout())
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    await authApi.login(username, password)
    const me = await authApi.me()
    setUser(me)
  }

  const register = async (username, email, password) => {
    await authApi.register(username, email, password)
    await login(username, password)
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
