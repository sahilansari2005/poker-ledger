import { BrowserRouter, Routes, Route } from "react-router-dom"
import MobileShell from "./components/layout/MobileShell"
import AllauthAuthGate from "./components/auth/AllauthAuthGate"
import Dashboard from "./pages/Dashboard"
import TablePage from "./pages/TablePage"
import SessionPage from "./pages/SessionPage"
import SummaryPage from "./pages/SummaryPage"
import LearnPage from "./pages/LearnPage"
import CalculatorPage from "./pages/CalculatorPage"
import SettingsPage from "./pages/SettingsPage"
import LoginPage from "./pages/LoginPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AllauthAuthGate />}>
          <Route element={<MobileShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/table/:id" element={<TablePage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/summary/:id" element={<SummaryPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
