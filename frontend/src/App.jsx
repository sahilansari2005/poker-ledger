import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import TablePage from "./pages/TablePage"
import SessionPage from "./pages/SessionPage"
import SummaryPage from "./pages/SummaryPage"
import LearnPage from "./pages/LearnPage"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/table/:id" element={<TablePage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/summary/:id" element={<SummaryPage />} />
          <Route path="/learn" element={<LearnPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
