import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Dashboard from "./pages/Dashboard"
import TablePage from "./pages/TablePage"
import SessionPage from "./pages/SessionPage"
import SummaryPage from "./pages/SummaryPage"
import LearnPage from "./pages/LearnPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/table/:id" element={<ProtectedRoute><TablePage /></ProtectedRoute>} />
        <Route path="/session/:id" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
        <Route path="/summary/:id" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
