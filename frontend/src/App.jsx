import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Activity, FilePlus } from 'lucide-react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import ReportView from './pages/ReportView'
import DataSandbox from './pages/DataSandbox'

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="logo">
            <Activity className="logo-icon" size={28} />
            SimulReport
          </Link>
          <div className="nav-links">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/generate" className="btn btn-primary">
              <FilePlus size={18} />
              New Report
            </Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/sandbox" element={<DataSandbox />} />
          <Route path="/report/:id" element={<ReportView />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
