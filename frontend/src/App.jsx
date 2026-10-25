import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import PageWrapper from './components/Layout/PageWrapper'
import DashboardPage from './pages/DashboardPage'
import ForecastExplorerPage from './pages/ForecastExplorerPage'
import AccuracyAnalysisPage from './pages/AccuracyAnalysisPage'
import DecisionSupportPage from './pages/DecisionSupportPage'

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageWrapper>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/explorer" element={<ForecastExplorerPage />} />
            <Route path="/accuracy" element={<AccuracyAnalysisPage />} />
            <Route path="/decisions" element={<DecisionSupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageWrapper>
      </main>
    </div>
  )
}

export default App
