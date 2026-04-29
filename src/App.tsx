import './App.css'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import CacheStatusPage from './pages/CacheStatusPage'
import IntakePage from './pages/IntakePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="page">
        <nav className="nav">
          <div className="brand">Intake</div>
          <div className="navLinks">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
              Home
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
              About
            </NavLink>
            <NavLink to="/cache" className={({ isActive }) => (isActive ? 'navLink active' : 'navLink')}>
              Cache Status
            </NavLink>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<IntakePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cache" element={<CacheStatusPage />} />
          <Route
            path="*"
            element={
              <div className="card">
                <h2>Not found</h2>
                <p className="muted">That page doesn’t exist.</p>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}